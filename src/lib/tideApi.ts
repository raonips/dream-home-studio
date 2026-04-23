// Stormglass tide data fetcher with 24h localStorage cache
// Coordinates: Barra do Jacuípe, BA — lat -12.7031, lng -38.1322

const STORMGLASS_KEY =
  "2b2cd5fc-3ebd-11f1-af8e-0242ac120004-2b2cd6ce-3ebd-11f1-af8e-0242ac120004";
const LAT = -12.7031;
const LNG = -38.1322;
const CACHE_KEY = "tide_cache_v1_barra_jacuipe";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export interface TideExtreme {
  time: string; // ISO UTC
  height: number; // meters
  type: "high" | "low";
}

export interface TideCache {
  fetchedAt: number;
  data: TideExtreme[];
}

export async function fetchTideExtremes(): Promise<TideExtreme[]> {
  // Check cache first
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
      // ignore parse errors
    }
  }

  // Fetch from today through +3 days (covers today + next 2 days fully)
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);

  const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${LAT}&lng=${LNG}&start=${Math.floor(
    start.getTime() / 1000,
  )}&end=${Math.floor(end.getTime() / 1000)}`;

  const res = await fetch(url, {
    headers: { Authorization: STORMGLASS_KEY },
  });

  if (!res.ok) {
    throw new Error(`Stormglass API error: ${res.status}`);
  }

  const json = await res.json();
  const data: TideExtreme[] = (json.data || []).map((d: any) => ({
    time: d.time,
    height: d.height,
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
