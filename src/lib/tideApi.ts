// Tide data fetcher — calls secure Supabase Edge Function `get-tides`.
// Applies Marinha do Brasil calibration (+1.34 m → Nível de Redução 2026).
// Caches results in localStorage for 24h to save API credits.

import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "tide_cache_v2_barra_jacuipe"; // bumped (calibration applied)
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

export async function fetchTideExtremes(): Promise<TideExtreme[]> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
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

  const { data: payload, error } = await supabase.functions.invoke("get-tides");

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
        CACHE_KEY,
        JSON.stringify({ fetchedAt: Date.now(), data } as TideCache),
      );
    } catch {
      // quota — ignore
    }
  }

  return data;
}
