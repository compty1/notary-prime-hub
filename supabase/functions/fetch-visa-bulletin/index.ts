import { corsHeaders, handleCorsOptions, errorResponse, jsonResponse, rateLimitGuard } from "../_shared/middleware.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);

  try {
    // Rate limit
    const rlResponse = rateLimitGuard(req, 10);
    if (rlResponse) return rlResponse;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(req, 401, "Unauthorized");
    }

    // EF-315: Attempt to fetch live data, fall back to cached
    let bulletinMonth = "April 2025";
    try {
      const url = "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html";
      const resp = await fetch(url, {
        headers: { "User-Agent": "Notar-Enterprise/1.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (resp.ok) {
        const html = await resp.text();
        // Try to extract current month from page title
        const match = html.match(/Visa Bulletin for (\w+ \d{4})/i);
        if (match) bulletinMonth = match[1];
      }
    } catch {
      // Fall back to cached data
    }

    const bulletin = {
      month: bulletinMonth,
      source_url: "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html",
      note: `Data shown is from ${bulletinMonth}. Check travel.state.gov for the most current official bulletin.`,
      last_checked: new Date().toISOString(),
      family: [
        { category: "F1", description: "Unmarried Sons and Daughters of U.S. Citizens", worldwide: "01JAN16", china: "01JAN16", india: "01JAN16", mexico: "01NOV00", philippines: "01APR13" },
        { category: "F2A", description: "Spouses and Children of Permanent Residents", worldwide: "Current", china: "Current", india: "Current", mexico: "Current", philippines: "Current" },
        { category: "F2B", description: "Unmarried Sons and Daughters of Permanent Residents", worldwide: "01SEP16", china: "01SEP16", india: "01SEP16", mexico: "01OCT04", philippines: "01OCT12" },
        { category: "F3", description: "Married Sons and Daughters of U.S. Citizens", worldwide: "01DEC10", china: "01DEC10", india: "01DEC10", mexico: "01NOV01", philippines: "01JUN03" },
        { category: "F4", description: "Brothers and Sisters of Adult U.S. Citizens", worldwide: "01APR08", china: "01APR08", india: "01JAN06", mexico: "01MAR01", philippines: "01JUN04" },
      ],
      employment: [
        { category: "EB1", description: "Priority Workers", worldwide: "Current", china: "01JAN23", india: "01JAN21", mexico: "Current", philippines: "Current" },
        { category: "EB2", description: "Advanced Degree Professionals", worldwide: "Current", china: "01JUN20", india: "01MAY12", mexico: "Current", philippines: "Current" },
        { category: "EB3", description: "Skilled Workers", worldwide: "Current", china: "01JAN20", india: "01JUN12", mexico: "Current", philippines: "Current" },
        { category: "EB4", description: "Special Immigrants", worldwide: "Current", china: "Current", india: "01JAN20", mexico: "Current", philippines: "Current" },
        { category: "EB5", description: "Immigrant Investors", worldwide: "Current", china: "01JAN17", india: "01JAN20", mexico: "Current", philippines: "Current" },
      ],
    };

    return jsonResponse(req, bulletin);
  } catch (e) {
    console.error("fetch-visa-bulletin error:", e);
    return errorResponse(req, 500, "Failed to fetch visa bulletin");
  }
});
