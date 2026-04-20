import { ArrowDown, ArrowUp, Sparkles, Lock, type LucideIcon } from "lucide-react";

export type TimelineEvent = {
  time: string;
  title: string;
  detail?: string;
  kind: "pool-open" | "low-peak" | "pool-close" | "high-peak";
  passed?: boolean;
};

const kindMeta: Record<TimelineEvent["kind"], { icon: LucideIcon; color: string; label: string }> = {
  "pool-open": { icon: Sparkles, color: "bg-nature", label: "Piscinas abrem" },
  "low-peak": { icon: ArrowDown, color: "bg-ocean", label: "Maré mínima" },
  "pool-close": { icon: Lock, color: "bg-coral", label: "Piscinas fecham" },
  "high-peak": { icon: ArrowUp, color: "bg-ocean-deep", label: "Maré alta" },
};

export function EventTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-border ml-4">
      {events.map((e, i) => {
        const meta = kindMeta[e.kind];
        const Icon = meta.icon;
        return (
          <li key={i} className="relative pl-6">
            <div className={`absolute -left-[13px] top-2 flex size-6 items-center justify-center rounded-full text-primary-foreground ${meta.color} ${e.passed ? "opacity-50" : ""}`}>
              <Icon size={12} />
            </div>
            <div className={`rounded-xl border p-3 ${e.passed ? "opacity-50 bg-muted/30" : "bg-card"}`}>
              <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                <span>{e.time}</span>
                <span>{meta.label}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{e.title}</p>
              {e.detail && <p className="text-xs text-muted-foreground mt-0.5">{e.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
