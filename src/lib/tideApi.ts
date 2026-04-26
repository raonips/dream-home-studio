// Tide data fetcher — calls secure Supabase Edge Function `get-tides`.
// The Edge Function uses a Postgres-backed cache (`tides_cache` table) so
// repeat requests for the same date+region never hit the Stormglass API.

import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_TIDE_REGION_SLUG } from "@/lib/tideRegions";

// Marinha do Brasil — Nível de Redução offset (Litoral Norte BA, ~2026)
export const MARINHA_OFFSET_M = 1.34;

export interface TideExtreme {
  time: string;
  height: number;
  type: "high" | "low";
}

const memoryCache = new Map<string, TideExtreme[]>();

/**
 * Fetch tide extremes for a given local date (YYYY-MM-DD, BRT) and region slug.
 */
export async function fetchTideExtremes(
  date: string,
  region: string = DEFAULT_TIDE_REGION_SLUG,
): Promise<TideExtreme[]> {
  const key = `${region}:${date}`;
  const hit = memoryCache.get(key);
  if (hit) return hit;

  const { data: payload, error } = await supabase.functions.invoke("get-tides", {
    body: { date, region },
  });

  if (error) throw new Error(error.message || "Erro ao chamar get-tides");
  if (payload?.error) throw new Error(payload.error);

  const rawData: any[] = payload?.data || [];
  const data: TideExtreme[] = rawData.map((d) => ({
    time: d.time,
    height: +(d.height + MARINHA_OFFSET_M).toFixed(2),
    type: d.type,
  }));

  memoryCache.set(key, data);
  return data;
}
