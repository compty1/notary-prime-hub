import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCorsOptions, errorResponse, jsonResponse, rateLimitGuard, requireEnvVars } from "../_shared/middleware.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  try {
    // Rate limit: 10 sync operations per minute
    const rlResponse = rateLimitGuard(req, 10);
    if (rlResponse) return rlResponse;

    // Auth check — admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(req, 401, "Unauthorized");
    }

    const envErr = requireEnvVars(req, "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");
    if (envErr) return envErr;

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !caller?.id) {
      return errorResponse(req, 401, "Invalid token");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify admin role
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin");
    if (!roleData || roleData.length === 0) {
      return errorResponse(req, 403, "Admin access required");
    }

    const HUBSPOT_API_KEY = Deno.env.get("HubSpot_Service_Key") || Deno.env.get("HUBSPOT_API_KEY");
    if (!HUBSPOT_API_KEY) {
      return errorResponse(req, 400, "HubSpot not configured", "Add HubSpot_Service_Key in Lovable Cloud secrets.");
    }

    const { action } = await req.json();

    if (action === "test") {
      const resp = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}` },
      });
      if (!resp.ok) {
        return jsonResponse(req, { connected: false, error: `HubSpot API error: ${resp.status}` });
      }
      return jsonResponse(req, { connected: true });
    }

    if (action === "push") {
      const { data: leads, error: leadsErr } = await supabase
        .from("leads")
        .select("*")
        .is("hubspot_contact_id", null)
        .not("email", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (leadsErr) throw leadsErr;
      if (!leads || leads.length === 0) {
        return jsonResponse(req, { success: true, pushed: 0, message: "No new leads to push." });
      }

      let pushed = 0;
      let errors = 0;

      for (const lead of leads) {
        try {
          const searchResp = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
            method: "POST",
            headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: lead.email }] }] }),
          });

          if (searchResp.status === 429) {
            const retryAfter = parseInt(searchResp.headers.get("Retry-After") || "10", 10);
            console.warn(`HubSpot 429 rate limit hit, waiting ${retryAfter}s`);
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            errors++;
            continue;
          }

          const searchData = await searchResp.json();
          let contactId: string;

          const contactProps = {
            firstname: lead.name?.split(" ")[0] || "",
            lastname: lead.name?.split(" ").slice(1).join(" ") || "",
            phone: lead.phone || "",
            company: lead.business_name || "",
            city: lead.city || "",
            state: lead.state || "",
            zip: lead.zip || "",
          };

          if (searchData.total > 0) {
            contactId = searchData.results[0].id;
            await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                properties: {
                  ...contactProps,
                  hs_lead_status: lead.status === "converted" ? "CONNECTED" : lead.status === "contacted" ? "IN_PROGRESS" : "NEW",
                },
              }),
            });
          } else {
            const createResp = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
              method: "POST",
              headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                properties: { email: lead.email, ...contactProps, hs_lead_status: "NEW" },
              }),
            });

            if (!createResp.ok) {
              console.error("HubSpot create error:", await createResp.text());
              errors++;
              continue;
            }
            const created = await createResp.json();
            contactId = created.id;
          }

          await supabase.from("leads").update({ hubspot_contact_id: contactId }).eq("id", lead.id);
          pushed++;
        } catch (e) {
          console.error("HubSpot sync error for lead:", lead.id, e);
          errors++;
        }
      }

      await supabase.from("audit_log").insert({
        action: "hubspot_sync_push",
        entity_type: "leads",
        details: { pushed, errors, total: leads.length },
      });

      return jsonResponse(req, { success: true, pushed, errors, message: `Pushed ${pushed} leads to HubSpot${errors > 0 ? `, ${errors} errors` : ""}.` });
    }

    if (action === "pull") {
      const resp = await fetch(
        "https://api.hubapi.com/crm/v3/objects/contacts?limit=50&properties=email,firstname,lastname,phone,company,city,state,zip,hs_lead_status&sorts=-createdate",
        { headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}` } }
      );

      if (!resp.ok) throw new Error(`HubSpot API error: ${resp.status}`);
      const data = await resp.json();
      const contacts = data.results || [];

      const { data: existingLeads } = await supabase
        .from("leads")
        .select("hubspot_contact_id, email")
        .not("hubspot_contact_id", "is", null);

      const existingHsIds = new Set((existingLeads || []).map((l: Record<string, unknown>) => l.hubspot_contact_id));
      const existingEmails = new Set(
        (existingLeads || []).map((l: Record<string, unknown>) => (l.email as string)?.toLowerCase()).filter(Boolean)
      );

      let pulled = 0;
      for (const contact of contacts) {
        if (existingHsIds.has(contact.id)) continue;
        const email = contact.properties.email?.toLowerCase();
        if (email && existingEmails.has(email)) continue;

        const name = [contact.properties.firstname, contact.properties.lastname]
          .filter(Boolean).join(" ").trim();

        await supabase.from("leads").insert({
          name: name || null,
          email: email || null,
          phone: contact.properties.phone || null,
          business_name: contact.properties.company || null,
          city: contact.properties.city || null,
          state: contact.properties.state || "OH",
          zip: contact.properties.zip || null,
          source: "hubspot",
          hubspot_contact_id: contact.id,
          status: "new",
          intent_score: "medium",
          lead_type: contact.properties.company ? "business" : "individual",
        });
        pulled++;
      }

      return jsonResponse(req, { success: true, pulled, message: `Pulled ${pulled} new contacts from HubSpot.` });
    }

    return errorResponse(req, 400, "Invalid action", "Use: test, push, pull");
  } catch (err: unknown) {
    console.error("hubspot-sync error:", err);
    return errorResponse(req, 500, "Internal server error");
  }
});
