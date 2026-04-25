import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Waves, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

// YYYY-MM-DD (zero-padded) — used as cache key & API payload
function brtDateString(ts: number): string {
  const d = new Date(ts + BRT_OFFSET_MS);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatRelativeDay(ts: number, nowTs: number): string {
  const k = brtDayKey(ts);
  if (k === brtDayKey(nowTs)) return "Hoje";
  if (k === brtDayKey(nowTs + 86400000)) return "Amanhã";
  return SHORT_DAY_FMT.format(new Date(ts));
}

// Start of given day (BRT) expressed as a UTC timestamp (ms).
function startOfBrtDayFor(ts: number): number {
  const d = new Date(ts + BRT_OFFSET_MS);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime() - BRT_OFFSET_MS;
}

// Carousel window: 30 days in the past → 25 days in the future (BRT day-aligned).
const CAROUSEL_PAST_DAYS = 30;
const CAROUSEL_FUTURE_DAYS = 25;

// Build the carousel using calendar arithmetic on the *local BRT date parts*
// (not by adding 86_400_000 ms repeatedly) so months always match what a
// human reading the calendar sees — no off-by-one drift.
function buildCarouselDays(nowTs: number): number[] {
  const todayStart = startOfBrtDayFor(nowTs);
  const base = new Date(todayStart + BRT_OFFSET_MS); // UTC parts == BRT date parts
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth();
  const d = base.getUTCDate();
  const days: number[] = [];
  for (let offset = -CAROUSEL_PAST_DAYS; offset <= CAROUSEL_FUTURE_DAYS; offset++) {
    // Date.UTC handles month/year roll-over correctly for any offset.
    const utcMidnight = Date.UTC(y, m, d + offset, 0, 0, 0);
    days.push(utcMidnight - BRT_OFFSET_MS); // → BRT 00:00 of that calendar day
  }
  return days;
}

const DAY_BTN_FMT_DAY = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  timeZone: TZ,
});
const DAY_BTN_FMT_MONTH = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: TZ,
});
const DAY_BTN_FMT_WEEKDAY = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  timeZone: TZ,
});

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
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  // Selected date (BRT day start, as UTC ms). Default = today.
  const [selectedDate, setSelectedDate] = useState<number>(() =>
    startOfBrtDayFor(Date.now()),
  );

  // Live clock — only ticks the "Agora" line, doesn't refetch
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch tides whenever selectedDate changes (cached per-date in localStorage)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const dateStr = brtDateString(selectedDate);
    fetchTideExtremes(dateStr)
      .then((d) => {
        if (!mounted) return;
        setExtremes(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || "Erro ao carregar marés");
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  const dayStart = selectedDate;
  const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

  const todayKey = brtDayKey(currentTime);
  const selectedKey = brtDayKey(selectedDate);
  const isViewingToday = todayKey === selectedKey;

  const dayExtremes = useMemo(() => {
    if (!extremes) return [];
    return extremes.filter(
      (e) => brtDayKey(new Date(e.time).getTime()) === selectedKey,
    );
  }, [extremes, selectedKey]);

  const upcoming = useMemo(() => {
    if (!extremes) return { high: null as TideExtreme | null, low: null as TideExtreme | null };
    const reference = isViewingToday ? currentTime : dayStart;
    const future = extremes.filter((e) => new Date(e.time).getTime() > reference);
    return {
      high: future.find((e) => e.type === "high") || null,
      low: future.find((e) => e.type === "low") || null,
    };
  }, [extremes, currentTime, isViewingToday, dayStart]);

  const curve = useMemo(
    () => buildDayCurve(extremes || [], dayStart, dayEnd),
    [extremes, dayStart, dayEnd],
  );

  const trend: "rising" | "falling" = useMemo(() => {
    const ref = isViewingToday ? currentTime : dayStart;
    const next = (extremes || []).find((e) => new Date(e.time).getTime() > ref);
    if (!next) return "rising";
    return next.type === "high" ? "rising" : "falling";
  }, [extremes, currentTime, isViewingToday, dayStart]);

  // ── Date carousel ────────────────────────────────────────────────────────
  const carouselDays = useMemo(
    () => buildCarouselDays(currentTime),
    // Only rebuild when the *day* changes, not every minute tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brtDayKey(currentTime)],
  );
  const firstDay = carouselDays[0];
  const lastDay = carouselDays[carouselDays.length - 1];

  const selectedBtnRef = useRef<HTMLButtonElement>(null);

  const didInitialScroll = useRef(false);
  useEffect(() => {
    // Wait one frame so layout has settled before measuring scroll position.
    const id = setTimeout(() => {
      if (selectedBtnRef.current) {
        selectedBtnRef.current.scrollIntoView({
          behavior: didInitialScroll.current ? "smooth" : "auto",
          inline: "center",
          block: "nearest",
        });
        didInitialScroll.current = true;
      }
    }, 100);
    return () => clearTimeout(id);
  }, [selectedDate]);

  const canPrev = selectedDate - 86_400_000 >= firstDay;
  const canNext = selectedDate + 86_400_000 <= lastDay;
  const goPrevDay = () => canPrev && setSelectedDate(selectedDate - 86_400_000);
  const goNextDay = () => canNext && setSelectedDate(selectedDate + 86_400_000);

  // Hover state for controlled tooltip with snap-back to "Agora"
  const [hovered, setHovered] = useState<{ t: number; height: number } | null>(null);

  // Live snap-back point: interpolated at the exact currentTime so it advances every tick
  const nowPoint = useMemo(() => {
    if (!curve.length) return null;
    if (currentTime <= curve[0].t) return { t: currentTime, height: curve[0].height };
    if (currentTime >= curve[curve.length - 1].t)
      return { t: currentTime, height: curve[curve.length - 1].height };
    // Binary-ish linear scan to find bracketing points (curve is sorted by t)
    let lo = curve[0];
    let hi = curve[curve.length - 1];
    for (let i = 1; i < curve.length; i++) {
      if (curve[i].t >= currentTime) {
        lo = curve[i - 1];
        hi = curve[i];
        break;
      }
    }
    const span = hi.t - lo.t || 1;
    const ratio = (currentTime - lo.t) / span;
    const height = lo.height + (hi.height - lo.height) * ratio;
    return { t: currentTime, height };
  }, [curve, currentTime]);

  // Clean ticks every 3h within the day window
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = 0; h <= 24; h += 3) {
      ticks.push(dayStart + h * 60 * 60 * 1000);
    }
    return ticks;
  }, [dayStart]);

  if (!extremes && loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center rounded-3xl border bg-card p-12">
        <Loader2 className="size-6 animate-spin text-ocean" />
        <span className="ml-3 text-sm text-muted-foreground">Carregando marés...</span>
      </div>
    );
  }

  if (!extremes && error) {
    // First load failed entirely — render shell with carousel so user can pick another date.
  }

  const selectedDayLabel = formatDay(selectedDate);
  const nowLabel = formatHour(currentTime);
  const headerTitle = isViewingToday
    ? "Maré de Hoje"
    : selectedDate < startOfBrtDayFor(currentTime)
      ? "Maré (passada)"
      : "Maré (prevista)";

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
            {headerTitle}
          </h2>
          <p className="mt-0.5 text-sm capitalize opacity-70">{selectedDayLabel}</p>
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
          {isViewingToday && (
            <p className="mt-2 text-xs opacity-70">agora · {nowLabel}</p>
          )}
        </div>
      </header>

      {/* Date carousel */}
      <div className="flex items-center gap-2 border-b bg-muted/20 px-2 py-3 sm:px-4">
        <button
          type="button"
          onClick={goPrevDay}
          disabled={!canPrev}
          aria-label="Dia anterior"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-foreground transition hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div
          className="flex flex-1 gap-2 overflow-x-auto scroll-smooth py-1"
          style={{ scrollbarWidth: "none" }}
        >
          {carouselDays.map((dayTs) => {
            const isSelected = brtDayKey(dayTs) === selectedKey;
            const isToday = brtDayKey(dayTs) === todayKey;
            return (
              <button
                key={dayTs}
                ref={isSelected ? selectedBtnRef : undefined}
                type="button"
                onClick={() => setSelectedDate(dayTs)}
                className={cn(
                  "flex min-w-[58px] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 text-xs transition",
                  isSelected
                    ? "border-ocean-deep bg-ocean-deep text-primary-foreground shadow-md ring-2 ring-ocean-deep/30 scale-[1.04]"
                    : isToday
                      ? "border-ocean/40 bg-background text-ocean-deep hover:bg-ocean/10"
                      : "border-border bg-background text-foreground hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    isSelected ? "opacity-90" : "opacity-60",
                  )}
                >
                  {isToday ? "Hoje" : DAY_BTN_FMT_WEEKDAY.format(new Date(dayTs)).replace(".", "")}
                </span>
                <span className="text-base font-bold leading-none">
                  {DAY_BTN_FMT_DAY.format(new Date(dayTs))}
                </span>
                <span
                  className={cn(
                    "text-[10px] capitalize",
                    isSelected ? "opacity-90" : "opacity-60",
                  )}
                >
                  {DAY_BTN_FMT_MONTH.format(new Date(dayTs)).replace(".", "")}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={goNextDay}
          disabled={!canNext}
          aria-label="Próximo dia"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-foreground transition hover:bg-muted disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {error ? (
        <div className="p-8 text-center">
          <p className="text-base font-medium text-foreground">
            Dados indisponíveis para esta data.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente uma data mais próxima.
          </p>
        </div>
      ) : loading && !extremes ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="size-5 animate-spin text-ocean" />
          <span className="ml-3 text-sm text-muted-foreground">Carregando marés...</span>
        </div>
      ) : (
        <>
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
                {formatRelativeDay(new Date(upcoming.high.time).getTime(), isViewingToday ? currentTime : selectedDate)}
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
                {formatRelativeDay(new Date(upcoming.low.time).getTime(), isViewingToday ? currentTime : selectedDate)}
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
          {isViewingToday && !hovered && nowPoint && currentTime >= dayStart && currentTime <= dayEnd && (() => {
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
              {isViewingToday && currentTime >= dayStart && currentTime <= dayEnd && (
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

      {/* Selected day's extremes list */}
      {dayExtremes.length > 0 && (
        <div className="border-t p-6">
          <h3 className="mb-3 text-sm font-semibold text-ocean-deep capitalize">
            {isViewingToday ? "Marés de Hoje" : `Marés · ${selectedDayLabel}`}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {dayExtremes.map((e) => (
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
        </>
      )}
    </article>
  );
}
