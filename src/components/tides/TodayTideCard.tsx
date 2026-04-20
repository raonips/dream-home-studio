import { ArrowDownRight, ArrowUpRight, MapPin, Share2 } from "lucide-react";
import { TideChart } from "./TideChart";
import { ConditionBadges } from "./ConditionBadges";
import { EventTimeline, type TimelineEvent } from "./EventTimeline";
import { PersonaSummary } from "./PersonaSummary";

const TIDE_POINTS = [
  { hour: 0, height: 1.9 },
  { hour: 3.5, height: 0.3 },
  { hour: 9.8, height: 2.1 },
  { hour: 16.0, height: 0.2 },
  { hour: 22.2, height: 2.0 },
  { hour: 24, height: 1.7 },
];

const CURRENT_HOUR = 14.5;
const CURRENT_HEIGHT = 0.55;
const TREND: "rising" | "falling" = "falling";

const TIMELINE: TimelineEvent[] = [
  { time: "02:10", title: "Piscinas começam a se formar", detail: "Maré desce abaixo de 0,4 m", kind: "pool-open", passed: true },
  { time: "03:30", title: "Maré Mínima — 0,3 m", detail: "Pico das piscinas no Caribinho", kind: "low-peak", passed: true },
  { time: "05:05", title: "Piscinas fecham", detail: "Maré sobe acima de 0,4 m", kind: "pool-close", passed: true },
  { time: "09:48", title: "Pico de Maré Alta — 2,1 m", detail: "Atenção barqueiros: correnteza forte", kind: "high-peak", passed: true },
  { time: "14:50", title: "Piscinas começam a se formar", detail: "Maré descendo, abaixo de 0,4 m", kind: "pool-open", passed: false },
  { time: "16:00", title: "Maré Mínima — 0,2 m", detail: "Pico do dia! Janela ideal pra crianças", kind: "low-peak", passed: false },
  { time: "17:30", title: "Piscinas fecham", detail: "Maré sobe acima de 0,4 m", kind: "pool-close", passed: false },
  { time: "22:12", title: "Pico de Maré Alta — 2,0 m", detail: "Boa janela pra surf na foz do rio", kind: "high-peak", passed: false },
];

export function TodayTideCard() {
  const shareText = encodeURIComponent(
    `🌊 Tábua de Marés HOJE em Barra do Jacuípe:\n` +
      `• Baixa-mar: 03:30 (0,3m) e 16:00 (0,2m) ← piscinas naturais!\n` +
      `• Preamar: 09:48 (2,1m) e 22:12 (2,0m)\n\n` +
      `Veja o gráfico completo: ${typeof window !== "undefined" ? window.location.origin : ""}/tabua-de-mares`,
  );
  const whatsappUrl = `https://wa.me/?text=${shareText}`;

  return (
    <article className="animate-tide-rise mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border bg-card shadow-card">
      <header className="flex items-start justify-between gap-4 bg-gradient-to-br from-ocean-deep to-ocean p-6 text-primary-foreground">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest opacity-70">
            <MapPin className="size-3.5" />
            Barra do Jacuípe · BA
          </div>
          <h2 className="mt-1 text-3xl font-semibold leading-tight sm:text-4xl text-primary-foreground">Maré de Hoje</h2>
          <p className="mt-0.5 text-sm opacity-70">domingo, 19 de abril</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 rounded-full bg-background/15 px-3 py-1 text-xs font-medium backdrop-blur">
            {TREND === "falling" ? <ArrowDownRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
            {TREND === "falling" ? "Secando" : "Enchendo"}
          </div>
          <p className="mt-2 text-4xl font-semibold leading-none">
            {CURRENT_HEIGHT.toFixed(2).replace(".", ",")}
            <span className="ml-1 text-base font-normal opacity-70">m</span>
          </p>
          <p className="mt-1 text-xs opacity-70">agora · 14:30</p>
        </div>
      </header>

      <div className="border-b bg-muted/30 p-5">
        <PersonaSummary currentHeight={CURRENT_HEIGHT} trend={TREND} />
      </div>

      <div className="px-2 pt-6 sm:px-6">
        <TideChart points={TIDE_POINTS} currentHour={CURRENT_HOUR} threshold={0.4} />
      </div>

      <div className="border-t p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-ocean-deep">Eventos do Dia</h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Linha do tempo</span>
        </div>
        <EventTimeline events={TIMELINE} />
      </div>

      <div className="border-t p-6">
        <h3 className="mb-3 text-sm font-semibold text-ocean-deep">O que isso significa pra você</h3>
        <ConditionBadges currentHeight={CURRENT_HEIGHT} trend={TREND} />
      </div>

      <div className="border-t bg-muted/10 p-5">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-nature px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:scale-[1.01] hover:opacity-90"
        >
          <Share2 className="size-4" />
          Compartilhar no WhatsApp
        </a>
      </div>
    </article>
  );
}
