// Edge Function: get-tides
// Returns tide extremes for a supported region (Litoral Norte BA) on a specific BRT date.
// Uses Supabase table `tides_cache` (UNIQUE region_slug+date_string) as persistent cache.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

// Keep this dictionary in sync with src/lib/tideRegions.ts
const REGIONS: Record<string, { lat: number; lng: number }> = {
  "barra-do-jacuipe": { lat: -12.694, lng: -38.087 },
  "guarajuba":        { lat: -12.651, lng: -38.064 },
  "arembepe":         { lat: -12.756, lng: -38.169 },
  "itacimirim":       { lat: -12.618, lng: -38.046 },
  "praia-do-forte":   { lat: -12.578, lng: -38.001 },
  "imbassai":         { lat: -12.493, lng: -37.954 },
};
const DEFAULT_REGION = "barra-do-jacuipe";

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

    // Parse `date` and `region`
    let dateStr: string | undefined;
    let regionSlug: string | undefined;
    try {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        if (isValidDateStr(body?.date)) dateStr = body.date;
        if (typeof body?.region === "string") regionSlug = body.region;
      } else {
        const url = new URL(req.url);
        const q = url.searchParams.get("date");
        const r = url.searchParams.get("region");
        if (isValidDateStr(q)) dateStr = q;
        if (r) regionSlug = r;
      }
    } catch {
      // ignore
    }

    if (!regionSlug || !REGIONS[regionSlug]) {
      regionSlug = DEFAULT_REGION;
    }

    if (!dateStr) {
      const nowBrt = new Date(Date.now() + BRT_OFFSET_MS);
      const y = nowBrt.getUTCFullYear();
      const m = String(nowBrt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(nowBrt.getUTCDate()).padStart(2, "0");
      dateStr = `${y}-${m}-${d}`;
    }

    const { lat, lng } = REGIONS[regionSlug];

    // 1. Cache HIT? Look up by (region_slug, date_string).
    const { data: cached, error: cacheErr } = await supabase
      .from("tides_cache")
      .select("tide_data")
      .eq("region_slug", regionSlug)
      .eq("date_string", dateStr)
      .maybeSingle();

    if (!cacheErr && cached?.tide_data) {
      return new Response(
        JSON.stringify({ data: cached.tide_data, date: dateStr, region: regionSlug, cached: true }),
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
    // 48h window so late-night users still see "next" tides on the following day.
    const endUtcMs = startUtcMs + 48 * 60 * 60 * 1000 - 1;

    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}&start=${Math.floor(
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

    // 3. Save to cache (best-effort upsert) keyed by (region_slug, date_string).
    if (data.length > 0) {
      await supabase
        .from("tides_cache")
        .upsert(
          { region_slug: regionSlug, date_string: dateStr, tide_data: data },
          { onConflict: "region_slug,date_string" },
        );
    }

    return new Response(
      JSON.stringify({ data, date: dateStr, region: regionSlug, cached: false }),
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
