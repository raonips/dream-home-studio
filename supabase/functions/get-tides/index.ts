// Edge Function: get-tides
// Proxies Stormglass API to keep the API key secret.
// Returns tide extremes for Barra do Jacuípe, BA.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LAT = -12.7031;
const LNG = -38.1322;

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

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);

    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${LAT}&lng=${LNG}&start=${Math.floor(
      start.getTime() / 1000,
    )}&end=${Math.floor(end.getTime() / 1000)}`;

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

    return new Response(JSON.stringify({ data }), {
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
