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
import { format, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fetchTideExtremes, type TideExtreme } from "@/lib/tideApi";

// Brasília is GMT-3, no DST since 2019
const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

function toBrt(iso: string): Date {
  const utc = new Date(iso);
  return new Date(utc.getTime() + BRT_OFFSET_MS);
}

function formatHourBrt(iso: string): string {
  return format(toBrt(iso), "HH:mm");
}

function formatDayBrt(iso: string): string {
  return format(toBrt(iso), "EEEE, d 'de' MMMM", { locale: ptBR });
}

function formatRelativeDay(iso: string): string {
  const now = new Date(Date.now() + BRT_OFFSET_MS);
  const d = toBrt(iso);
  const sameDay =
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate();
  if (sameDay) return "Hoje";
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(now.getUTCDate() + 1);
  if (
    d.getUTCFullYear() === tomorrow.getUTCFullYear() &&
    d.getUTCMonth() === tomorrow.getUTCMonth() &&
    d.getUTCDate() === tomorrow.getUTCDate()
  )
    return "Amanhã";
  return format(d, "EEE, d/MM", { locale: ptBR });
}

// Build a smooth curve by interpolating sine between extremes.
// `key` is unique (includes date) so Recharts ReferenceLine can target a
// specific point; `label` is the user-visible HH:mm tick.
function buildCurve(extremes: TideExtreme[]) {
  if (extremes.length < 2) return [];
  const points: { t: number; key: string; label: string; height: number; iso: string }[] = [];
  for (let i = 0; i < extremes.length - 1; i++) {
    const a = extremes[i];
    const b = extremes[i + 1];
    const tA = new Date(a.time).getTime();
    const tB = new Date(b.time).getTime();
    const steps = 12;
    for (let s = 0; s < steps; s++) {
      const f = s / steps;
      const ease = (1 - Math.cos(f * Math.PI)) / 2;
      const h = a.height + (b.height - a.height) * ease;
      const t = tA + (tB - tA) * f;
      const iso = new Date(t).toISOString();
      points.push({
        t,
        key: `${t}`,
        label: formatHourBrt(iso),
        height: +h.toFixed(2),
        iso,
      });
    }
  }
  const last = extremes[extremes.length - 1];
  const lt = new Date(last.time).getTime();
  points.push({
    t: lt,
    key: `${lt}`,
    label: formatHourBrt(last.time),
    height: +last.height.toFixed(2),
    iso: last.time,
  });
  return points;
}

export function RealTideWidget() {
  const [extremes, setExtremes] = useState<TideExtreme[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    fetchTideExtremes()
      .then((d) => mounted && setExtremes(d))
      .catch((e) => mounted && setError(e.message || "Erro ao carregar marés"));
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const todayExtremes = useMemo(() => {
    if (!extremes) return [];
    const nowBrt = new Date(now + BRT_OFFSET_MS);
    return extremes.filter((e) => {
      const d = toBrt(e.time);
      return (
        d.getUTCFullYear() === nowBrt.getUTCFullYear() &&
        d.getUTCMonth() === nowBrt.getUTCMonth() &&
        d.getUTCDate() === nowBrt.getUTCDate()
      );
    });
  }, [extremes, now]);

  const upcoming = useMemo(() => {
    if (!extremes) return { high: null as TideExtreme | null, low: null as TideExtreme | null };
    const future = extremes.filter((e) => new Date(e.time).getTime() > now);
    return {
      high: future.find((e) => e.type === "high") || null,
      low: future.find((e) => e.type === "low") || null,
    };
  }, [extremes, now]);

  const curve = useMemo(() => buildCurve(extremes || []), [extremes]);

  const trend: "rising" | "falling" = useMemo(() => {
    const next = (extremes || []).find((e) => new Date(e.time).getTime() > now);
    if (!next) return "rising";
    return next.type === "high" ? "rising" : "falling";
  }, [extremes, now]);

  const next3Days = useMemo(() => {
    if (!extremes) return [] as { day: string; items: TideExtreme[] }[];
    const buckets = new Map<string, TideExtreme[]>();
    for (const e of extremes) {
      const d = toBrt(e.time);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(e);
    }
    return Array.from(buckets.entries())
      .slice(0, 3)
      .map(([, items]) => ({
        day: formatRelativeDay(items[0].time),
        items,
      }));
  }, [extremes]);

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

  const todayLabel = formatDayBrt(new Date(now).toISOString());
  const nowLabelBrt = format(new Date(now + BRT_OFFSET_MS), "HH:mm");

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
          <p className="mt-2 text-xs opacity-70">agora · {nowLabelBrt}</p>
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
                {formatHourBrt(upcoming.high.time)}
              </p>
              <p className="text-sm text-muted-foreground">
                {upcoming.high.height.toFixed(2).replace(".", ",")} m ·{" "}
                {formatRelativeDay(upcoming.high.time)}
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
                {formatHourBrt(upcoming.low.time)}
              </p>
              <p className="text-sm text-muted-foreground">
                {upcoming.low.height.toFixed(2).replace(".", ",")} m ·{" "}
                {formatRelativeDay(upcoming.low.time)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-2 pt-2 sm:px-6">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tideStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--ocean))" />
                  <stop offset="100%" stopColor="hsl(var(--ocean-deep))" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="key"
                tickFormatter={(_v, i) => curve[i]?.label ?? ""}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                interval={Math.max(1, Math.floor(curve.length / 8))}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}m`}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload;
                  return p ? `${formatRelativeDay(p.iso)} · ${p.label}` : "";
                }}
                formatter={(v: number) => [`${v.toFixed(2)} m`, "Altura"]}
              />
              {(() => {
                const nowPoint = curve.find((p) => p.t >= now);
                if (!nowPoint) return null;
                return (
                  <ReferenceLine
                    x={nowPoint.key}
                    stroke="hsl(var(--coral))"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Agora · ${nowPoint.label}`,
                      fill: "hsl(var(--coral))",
                      fontSize: 11,
                      fontWeight: 600,
                      position: "top",
                    }}
                  />
                );
              })()}
              <Line
                type="monotone"
                dataKey="height"
                stroke="url(#tideStroke)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "hsl(var(--ocean))" }}
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
                    {formatHourBrt(e.time)} · {e.height.toFixed(2).replace(".", ",")} m
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
            <div key={bucket.day} className="rounded-xl border bg-card p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider capitalize text-muted-foreground">
                {bucket.day}
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
                    {formatHourBrt(e.time)} · {e.height.toFixed(2).replace(".", ",")}m
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
