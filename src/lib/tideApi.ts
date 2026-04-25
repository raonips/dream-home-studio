// Tide data fetcher — calls secure Supabase Edge Function `get-tides`.
// The Edge Function uses a Postgres-backed cache (`tides_cache` table) so
// repeat requests for the same date never hit the Stormglass API.
// We keep a tiny in-memory cache here to avoid duplicate calls during a
// single session (e.g. when the user toggles between two dates quickly).

import { supabase } from "@/integrations/supabase/client";

// Marinha do Brasil — Nível de Redução offset for Barra do Jacuípe (2026)
export const MARINHA_OFFSET_M = 1.34;

export interface TideExtreme {
  time: string; // ISO UTC
  height: number; // meters (already calibrated to Marinha)
  type: "high" | "low";
}

const memoryCache = new Map<string, TideExtreme[]>();

/**
 * Fetch tide extremes for a specific local date (YYYY-MM-DD in BRT).
 * Lazy: only runs when called (i.e. when the user picks a date).
 */
export async function fetchTideExtremes(date: string): Promise<TideExtreme[]> {
  const hit = memoryCache.get(date);
  if (hit) return hit;

  const { data: payload, error } = await supabase.functions.invoke("get-tides", {
    body: { date },
  });

  if (error) {
    throw new Error(error.message || "Erro ao chamar get-tides");
  }
  if (payload?.error) {
    throw new Error(payload.error);
  }

  const rawData: any[] = payload?.data || [];
  const data: TideExtreme[] = rawData.map((d) => ({
    time: d.time,
    height: +(d.height + MARINHA_OFFSET_M).toFixed(2),
    type: d.type,
  }));

  memoryCache.set(date, data);
  return data;
}
