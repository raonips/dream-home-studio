// Edge Function: get-tides
// Proxies Stormglass API to keep the API key secret.
// Returns tide extremes for Barra do Jacuípe, BA for a specific local date (BRT).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const LAT = -12.7031;
const LNG = -38.1322;

// Brasília fixed offset (no DST since 2019): UTC-3
const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

function isValidDateStr(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("STORMGLASS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "STORMGLASS_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse optional `date` (YYYY-MM-DD, BRT local). Defaults to "today" in BRT.
    let dateStr: string | undefined;
    try {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        if (isValidDateStr(body?.date)) dateStr = body.date;
      } else {
        const url = new URL(req.url);
        const q = url.searchParams.get("date");
        if (isValidDateStr(q)) dateStr = q;
      }
    } catch {
      // ignore parse errors → default to today
    }

    if (!dateStr) {
      const nowBrt = new Date(Date.now() + BRT_OFFSET_MS);
      const y = nowBrt.getUTCFullYear();
      const m = String(nowBrt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(nowBrt.getUTCDate()).padStart(2, "0");
      dateStr = `${y}-${m}-${d}`;
    }

    // Compose 00:00:00 and 23:59:59 of the selected BRT date as UTC timestamps.
    // BRT 00:00 of YYYY-MM-DD = UTC 03:00 of same date.
    const [yy, mm, dd] = dateStr.split("-").map(Number);
    const startUtcMs = Date.UTC(yy, mm - 1, dd, 0, 0, 0) - BRT_OFFSET_MS;
    const endUtcMs = Date.UTC(yy, mm - 1, dd, 23, 59, 59) - BRT_OFFSET_MS;

    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${LAT}&lng=${LNG}&start=${Math.floor(
      startUtcMs / 1000,
    )}&end=${Math.floor(endUtcMs / 1000)}`;

    const res = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: `Stormglass error ${res.status}`, details: text }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const json = await res.json();
    const data = (json.data || []).map((d: any) => ({
      time: d.time,
      height: d.height,
      type: d.type,
    }));

    return new Response(JSON.stringify({ data, date: dateStr }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
