import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, MapPin, Waves, Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { fetchTideExtremes, type TideExtreme } from "@/lib/tideApi";

// Brasília: GMT-3, no DST since 2019
const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;
const TZ = "America/Sao_Paulo";

const HOUR_FMT = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ,
});
const DAY_FMT = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: TZ,
});
const SHORT_DAY_FMT = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: TZ,
});

const formatHour = (ts: number) => HOUR_FMT.format(new Date(ts));
const formatDay = (ts: number) => DAY_FMT.format(new Date(ts));

// YYYY-MM-DD in BRT for grouping/comparing days
function brtDayKey(ts: number): string {
  const d = new Date(ts + BRT_OFFSET_MS);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function formatRelativeDay(ts: number, nowTs: number): string {
  const k = brtDayKey(ts);
  if (k === brtDayKey(nowTs)) return "Hoje";
  if (k === brtDayKey(nowTs + 86400000)) return "Amanhã";
  return SHORT_DAY_FMT.format(new Date(ts));
}

// Start of "today" in BRT, expressed as a UTC timestamp (ms).
function startOfBrtDay(nowTs: number): number {
  const d = new Date(nowTs + BRT_OFFSET_MS);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() - BRT_OFFSET_MS;
}

// Build a smooth 24h curve for the current BRT day using cosine interpolation
// between consecutive extremes. To guarantee full coverage from 00:00 → 23:59,
// we synthesize virtual extremes before the first / after the last real ones
// (mirroring the neighboring half-cycle), so the curve never flat-lines at the
// edges of the day window.
function buildDayCurve(
  extremes: TideExtreme[],
  dayStart: number,
  dayEnd: number,
) {
  if (extremes.length < 2) return [] as { t: number; height: number }[];
  const sorted = [...extremes]
    .map((e) => ({ t: new Date(e.time).getTime(), h: e.height, type: e.type }))
    .sort((a, b) => a.t - b.t);

  // Default semi-diurnal half-cycle (~6h12m) used as fallback period.
  const DEFAULT_HALF = 6 * 60 * 60 * 1000 + 12 * 60 * 1000;

  // Pad on the left until we cover dayStart
  while (sorted[0].t > dayStart) {
    const a = sorted[0];
    const b = sorted[1];
    const period = b ? b.t - a.t : DEFAULT_HALF;
    sorted.unshift({
      t: a.t - period,
      h: b ? b.h : a.h, // mirror neighbor height (opposite extreme)
      type: a.type === "high" ? "low" : "high",
    });
  }
  // Pad on the right until we cover dayEnd
  while (sorted[sorted.length - 1].t < dayEnd) {
    const z = sorted[sorted.length - 1];
    const y = sorted[sorted.length - 2];
    const period = y ? z.t - y.t : DEFAULT_HALF;
    sorted.push({
      t: z.t + period,
      h: y ? y.h : z.h,
      type: z.type === "high" ? "low" : "high",
    });
  }

  const points: { t: number; height: number }[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (b.t < dayStart || a.t > dayEnd) continue;

    const steps = 24; // smooth half-cycle
    for (let s = 0; s <= steps; s++) {
      const f = s / steps;
      const t = a.t + (b.t - a.t) * f;
      if (t < dayStart || t > dayEnd) continue;
      const ease = (1 - Math.cos(f * Math.PI)) / 2;
      const h = a.h + (b.h - a.h) * ease;
      points.push({ t, height: +h.toFixed(2) });
    }
  }
  // Dedup by timestamp (boundary overlaps)
  const seen = new Set<number>();
  return points
    .filter((p) => {
      if (seen.has(p.t)) return false;
      seen.add(p.t);
      return true;
    })
    .sort((a, b) => a.t - b.t);
}

export function RealTideWidget() {
  const [extremes, setExtremes] = useState<TideExtreme[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    let mounted = true;
    fetchTideExtremes()
      .then((d) => mounted && setExtremes(d))
      .catch((e) => mounted && setError(e.message || "Erro ao carregar marés"));
    const t = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const dayStart = useMemo(() => startOfBrtDay(currentTime), [currentTime]);
  const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

  const todayExtremes = useMemo(() => {
    if (!extremes) return [];
    const k = brtDayKey(currentTime);
    return extremes.filter((e) => brtDayKey(new Date(e.time).getTime()) === k);
  }, [extremes, currentTime]);

  const upcoming = useMemo(() => {
    if (!extremes) return { high: null as TideExtreme | null, low: null as TideExtreme | null };
    const future = extremes.filter((e) => new Date(e.time).getTime() > currentTime);
    return {
      high: future.find((e) => e.type === "high") || null,
      low: future.find((e) => e.type === "low") || null,
    };
  }, [extremes, currentTime]);

  const curve = useMemo(
    () => buildDayCurve(extremes || [], dayStart, dayEnd),
    [extremes, dayStart, dayEnd],
  );

  const trend: "rising" | "falling" = useMemo(() => {
    const next = (extremes || []).find((e) => new Date(e.time).getTime() > currentTime);
    if (!next) return "rising";
    return next.type === "high" ? "rising" : "falling";
  }, [extremes, currentTime]);

  const next3Days = useMemo(() => {
    if (!extremes) return [] as { dayLabel: string; key: string; items: TideExtreme[] }[];
    const buckets = new Map<string, TideExtreme[]>();
    for (const e of extremes) {
      const ts = new Date(e.time).getTime();
      const key = brtDayKey(ts);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(e);
    }
    return Array.from(buckets.entries())
      .slice(0, 3)
      .map(([key, items]) => ({
        key,
        dayLabel: formatRelativeDay(new Date(items[0].time).getTime(), currentTime),
        items,
      }));
  }, [extremes, currentTime]);

  // Hover state for controlled tooltip with snap-back to "Agora"
  const [hovered, setHovered] = useState<{ t: number; height: number } | null>(null);

  // Closest curve point to currentTime — used as snap-back default
  const nowPoint = useMemo(() => {
    if (!curve.length) return null;
    let best = curve[0];
    let bestDiff = Math.abs(curve[0].t - currentTime);
    for (const p of curve) {
      const d = Math.abs(p.t - currentTime);
      if (d < bestDiff) {
        bestDiff = d;
        best = p;
      }
    }
    return best;
  }, [curve, currentTime]);

  // Clean ticks every 3h within the day window
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = 0; h <= 24; h += 3) {
      ticks.push(dayStart + h * 60 * 60 * 1000);
    }
    return ticks;
  }, [dayStart]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-3xl border bg-card p-8 text-center">
        <p className="text-sm text-destructive">Não foi possível carregar a tábua de marés.</p>
        <p className="mt-2 text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!extremes) {
    return (
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center rounded-3xl border bg-card p-12">
        <Loader2 className="size-6 animate-spin text-ocean" />
        <span className="ml-3 text-sm text-muted-foreground">Carregando marés...</span>
      </div>
    );
  }

  const todayLabel = formatDay(currentTime);
  const nowLabel = formatHour(currentTime);

  return (
    <article className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border bg-card shadow-card">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 bg-gradient-to-br from-ocean-deep to-ocean p-6 text-primary-foreground">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest opacity-70">
            <MapPin className="size-3.5" />
            Barra do Jacuípe · BA
          </div>
          <h2 className="mt-1 text-3xl font-semibold leading-tight sm:text-4xl text-primary-foreground">
            Maré de Hoje
          </h2>
          <p className="mt-0.5 text-sm capitalize opacity-70">{todayLabel}</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 rounded-full bg-background/15 px-3 py-1 text-xs font-medium backdrop-blur">
            {trend === "falling" ? (
              <ArrowDownRight className="size-3.5" />
            ) : (
              <ArrowUpRight className="size-3.5" />
            )}
            {trend === "falling" ? "Secando" : "Enchendo"}
          </div>
          <p className="mt-2 text-xs opacity-70">agora · {nowLabel}</p>
        </div>
      </header>

      {/* Quick cards */}
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-ocean/20 bg-gradient-to-br from-ocean/5 to-ocean/10 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ocean-deep">
            <ArrowUpRight className="size-4" />
            Próxima Maré Alta
          </div>
          {upcoming.high ? (
            <>
              <p className="mt-2 text-2xl font-bold text-ocean-deep">
                {formatHour(new Date(upcoming.high.time).getTime())}
              </p>
              <p className="text-sm text-muted-foreground">
                {upcoming.high.height.toFixed(2).replace(".", ",")} m ·{" "}
                {formatRelativeDay(new Date(upcoming.high.time).getTime(), currentTime)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">—</p>
          )}
        </div>
        <div className="rounded-2xl border border-nature/20 bg-gradient-to-br from-nature/5 to-nature/10 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nature">
            <ArrowDownRight className="size-4" />
            Próxima Maré Baixa
          </div>
          {upcoming.low ? (
            <>
              <p className="mt-2 text-2xl font-bold text-nature">
                {formatHour(new Date(upcoming.low.time).getTime())}
              </p>
              <p className="text-sm text-muted-foreground">
                {upcoming.low.height.toFixed(2).replace(".", ",")} m ·{" "}
                {formatRelativeDay(new Date(upcoming.low.time).getTime(), currentTime)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-2 pt-2 sm:px-6">
        <div className="relative h-64 w-full">
          {/* Snap-back floating tooltip — shown when user is NOT hovering */}
          {!hovered && nowPoint && currentTime >= dayStart && currentTime <= dayEnd && (() => {
            const pct = ((currentTime - dayStart) / (dayEnd - dayStart)) * 100;
            // Chart inner plotting area roughly excludes YAxis (~30px) and right margin (~60px).
            // We approximate using percentage of full container with offsets.
            const isRightHalf = pct > 50;
            return (
              <div
                className="pointer-events-none absolute top-2 z-10"
                style={{
                  left: `calc(${pct}% + ${isRightHalf ? -8 : 8}px)`,
                  transform: isRightHalf ? "translateX(-100%)" : "none",
                }}
              >
                <div className="rounded-xl border border-border/60 bg-background px-3 py-2 shadow-lg">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-coral">
                    Agora
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {formatHour(nowPoint.t)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Altura:{" "}
                    <span className="font-semibold text-ocean-deep">
                      {nowPoint.height.toFixed(2).replace(".", ",")} m
                    </span>
                  </p>
                </div>
              </div>
            );
          })()}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={curve}
              margin={{ top: 28, right: 60, left: -10, bottom: 0 }}
              onMouseMove={(state: any) => {
                const p = state?.activePayload?.[0]?.payload;
                if (p && typeof p.t === "number") {
                  setHovered({ t: p.t, height: p.height });
                } else if (hovered) {
                  setHovered(null);
                }
              }}
              onMouseLeave={() => setHovered(null)}
            >
              <defs>
                <linearGradient id="tideStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--ocean))" />
                  <stop offset="100%" stopColor="hsl(var(--ocean-deep))" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={[dayStart, dayEnd]}
                ticks={xTicks}
                tickFormatter={(v) => formatHour(v as number)}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}m`}
                width={40}
                domain={["auto", "auto"]}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--ocean))", strokeOpacity: 0.3 }}
                content={(props: any) => {
                  const payload = props?.payload?.[0]?.payload;
                  if (!payload) return null;
                  return (
                    <div className="rounded-xl border border-border/60 bg-background px-3 py-2 shadow-lg">
                      <p className="text-xs font-medium text-foreground">
                        {formatHour(payload.t)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Altura:{" "}
                        <span className="font-semibold text-ocean-deep">
                          {payload.height.toFixed(2).replace(".", ",")} m
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
              {currentTime >= dayStart && currentTime <= dayEnd && (
                <ReferenceLine
                  x={currentTime}
                  stroke="hsl(var(--coral))"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
              <Line
                type="monotone"
                dataKey="height"
                stroke="url(#tideStroke)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "hsl(var(--ocean))" }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's extremes list */}
      {todayExtremes.length > 0 && (
        <div className="border-t p-6">
          <h3 className="mb-3 text-sm font-semibold text-ocean-deep">Marés de Hoje</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {todayExtremes.map((e) => (
              <div
                key={e.time}
                className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3"
              >
                {e.type === "high" ? (
                  <ArrowUpRight className="size-5 text-ocean" />
                ) : (
                  <ArrowDownRight className="size-5 text-nature" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {e.type === "high" ? "Maré Alta" : "Maré Baixa"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatHour(new Date(e.time).getTime())} ·{" "}
                    {e.height.toFixed(2).replace(".", ",")} m
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next 3 days */}
      <div className="border-t bg-muted/10 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ocean-deep">
          <Waves className="size-4" />
          Próximos Dias
        </h3>
        <div className="space-y-3">
          {next3Days.map((bucket) => (
            <div key={bucket.key} className="rounded-xl border bg-card p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider capitalize text-muted-foreground">
                {bucket.dayLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {bucket.items.map((e) => (
                  <span
                    key={e.time}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      e.type === "high"
                        ? "bg-ocean/10 text-ocean-deep"
                        : "bg-nature/10 text-nature"
                    }`}
                  >
                    {e.type === "high" ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {formatHour(new Date(e.time).getTime())} ·{" "}
                    {e.height.toFixed(2).replace(".", ",")}m
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
