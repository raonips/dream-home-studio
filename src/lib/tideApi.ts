// Tide data fetcher — calls secure Supabase Edge Function `get-tides`.
// Applies Marinha do Brasil calibration (+1.34 m → Nível de Redução 2026).
// Caches results in localStorage per-date to save API credits.

import { supabase } from "@/integrations/supabase/client";

const CACHE_PREFIX = "tide_data_v3_"; // bumped (per-date cache)
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// Marinha do Brasil — Nível de Redução offset for Barra do Jacuípe (2026)
export const MARINHA_OFFSET_M = 1.34;

export interface TideExtreme {
  time: string; // ISO UTC
  height: number; // meters (already calibrated to Marinha)
  type: "high" | "low";
}

export interface TideCache {
  fetchedAt: number;
  data: TideExtreme[];
}

/**
 * Fetch tide extremes for a specific local date (YYYY-MM-DD in BRT).
 * Cache key includes the date so navigating between days reuses cached data.
 */
export async function fetchTideExtremes(date: string): Promise<TideExtreme[]> {
  const cacheKey = `${CACHE_PREFIX}${date}`;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached: TideCache = JSON.parse(raw);
        if (Date.now() - cached.fetchedAt < CACHE_TTL && cached.data?.length) {
          return cached.data;
        }
      }
    } catch {
      // ignore
    }
  }

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

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ fetchedAt: Date.now(), data } as TideCache),
      );
    } catch {
      // quota — ignore
    }
  }

  return data;
}
