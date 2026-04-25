// Edge Function: get-tides
// Returns tide extremes for Barra do Jacuípe, BA for a specific local date (BRT).
// Uses Supabase table `tides_cache` as persistent cache to avoid repeat Stormglass calls.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const LAT = -12.7031;
const LNG = -38.1322;
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase env not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse `date` (YYYY-MM-DD, BRT). Default = today (BRT).
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
      // ignore
    }

    if (!dateStr) {
      const nowBrt = new Date(Date.now() + BRT_OFFSET_MS);
      const y = nowBrt.getUTCFullYear();
      const m = String(nowBrt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(nowBrt.getUTCDate()).padStart(2, "0");
      dateStr = `${y}-${m}-${d}`;
    }

    // Cache key bumped to v2 because window expanded from 24h → 48h.
    const cacheKey = `v2:${dateStr}`;

    // 1. Cache HIT? Look up in tides_cache.
    const { data: cached, error: cacheErr } = await supabase
      .from("tides_cache")
      .select("tide_data")
      .eq("date_string", cacheKey)
      .maybeSingle();

    if (!cacheErr && cached?.tide_data) {
      return new Response(
        JSON.stringify({ data: cached.tide_data, date: dateStr, cached: true }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=3600",
          },
        },
      );
    }

    // 2. Cache MISS — call Stormglass.
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "STORMGLASS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const [yy, mm, dd] = dateStr.split("-").map(Number);
    const startUtcMs = Date.UTC(yy, mm - 1, dd, 0, 0, 0) - BRT_OFFSET_MS;
    // Fetch 48h window so late-night users still see "next" tides on the following day.
    const endUtcMs = startUtcMs + 48 * 60 * 60 * 1000 - 1;

    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${LAT}&lng=${LNG}&start=${Math.floor(
      startUtcMs / 1000,
    )}&end=${Math.floor(endUtcMs / 1000)}`;

    const res = await fetch(url, { headers: { Authorization: apiKey } });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: `Stormglass error ${res.status}`, details: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = await res.json();
    const data = (json.data || []).map((d: any) => ({
      time: d.time,
      height: d.height,
      type: d.type,
    }));

    // 3. Save to cache (best-effort upsert).
    if (data.length > 0) {
      await supabase
        .from("tides_cache")
        .upsert({ date_string: cacheKey, tide_data: data }, { onConflict: "date_string" });
    }

    return new Response(
      JSON.stringify({ data, date: dateStr, cached: false }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
