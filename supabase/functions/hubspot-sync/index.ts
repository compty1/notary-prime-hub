import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const HUBSPOT_API_KEY = Deno.env.get("HUBSPOT_API_KEY");
    if (!HUBSPOT_API_KEY) {
      return new Response(
        JSON.stringify({ error: "HubSpot API key not configured. Add it in Admin Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action } = await req.json();

    if (action === "test") {
      // Test HubSpot connection
      const resp = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}` },
      });
      if (!resp.ok) {
        const err = await resp.text();
        return new Response(
          JSON.stringify({ connected: false, error: `HubSpot API error: ${resp.status}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ connected: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "push") {
      // Push leads without hubspot_contact_id to HubSpot
      const { data: leads, error: leadsErr } = await supabase
        .from("leads")
        .select("*")
        .is("hubspot_contact_id", null)
        .not("email", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (leadsErr) throw leadsErr;
      if (!leads || leads.length === 0) {
        return new Response(
          JSON.stringify({ success: true, pushed: 0, message: "No new leads to push." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let pushed = 0;
      let errors = 0;

      for (const lead of leads) {
        try {
          // Check if contact already exists in HubSpot by email
          const searchResp = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${HUBSPOT_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filterGroups: [{
                filters: [{
                  propertyName: "email",
                  operator: "EQ",
                  value: lead.email,
                }],
              }],
            }),
          });

          // Handle 429 rate limits with exponential backoff
          if (searchResp.status === 429) {
            const retryAfter = parseInt(searchResp.headers.get("Retry-After") || "10", 10);
            console.warn(`HubSpot 429 rate limit hit, waiting ${retryAfter}s`);
            await new Promise(r => setTimeout(r, retryAfter * 1000));
            errors++;
            continue;
          }

          const searchData = await searchResp.json();
          let contactId: string;

          if (searchData.total > 0) {
            // Contact exists, update
            contactId = searchData.results[0].id;
            await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${HUBSPOT_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                properties: {
                  firstname: lead.name?.split(" ")[0] || "",
                  lastname: lead.name?.split(" ").slice(1).join(" ") || "",
                  phone: lead.phone || "",
                  company: lead.business_name || "",
                  city: lead.city || "",
                  state: lead.state || "",
                  zip: lead.zip || "",
                  hs_lead_status: lead.status === "converted" ? "CONNECTED" : lead.status === "contacted" ? "IN_PROGRESS" : "NEW",
                },
              }),
            });
          } else {
            // Create new contact
            const createResp = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${HUBSPOT_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                properties: {
                  email: lead.email,
                  firstname: lead.name?.split(" ")[0] || "",
                  lastname: lead.name?.split(" ").slice(1).join(" ") || "",
                  phone: lead.phone || "",
                  company: lead.business_name || "",
                  city: lead.city || "",
                  state: lead.state || "",
                  zip: lead.zip || "",
                  hs_lead_status: "NEW",
                },
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

          // Update lead with HubSpot contact ID
          await supabase
            .from("leads")
            .update({ hubspot_contact_id: contactId })
            .eq("id", lead.id);

          pushed++;
        } catch (e) {
          console.error("HubSpot sync error for lead:", lead.id, e);
          errors++;
        }
      }

      // Audit log
      await supabase.from("audit_log").insert({
        action: "hubspot_sync_push",
        entity_type: "leads",
        details: { pushed, errors, total: leads.length },
      });

      return new Response(
        JSON.stringify({
          success: true,
          pushed,
          errors,
          message: `Pushed ${pushed} leads to HubSpot${errors > 0 ? `, ${errors} errors` : ""}.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "pull") {
      // Pull recent contacts from HubSpot that aren't already in leads
      const resp = await fetch(
        "https://api.hubapi.com/crm/v3/objects/contacts?limit=50&properties=email,firstname,lastname,phone,company,city,state,zip,hs_lead_status&sorts=-createdate",
        { headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}` } }
      );

      if (!resp.ok) throw new Error(`HubSpot API error: ${resp.status}`);
      const data = await resp.json();
      const contacts = data.results || [];

      // Get existing HubSpot IDs
      const { data: existingLeads } = await supabase
        .from("leads")
        .select("hubspot_contact_id, email")
        .not("hubspot_contact_id", "is", null);

      const existingHsIds = new Set((existingLeads || []).map((l) => l.hubspot_contact_id));
      const existingEmails = new Set(
        (existingLeads || []).map((l) => l.email?.toLowerCase()).filter(Boolean)
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

      return new Response(
        JSON.stringify({
          success: true,
          pulled,
          message: `Pulled ${pulled} new contacts from HubSpot.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: test, push, pull" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("hubspot-sync error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
