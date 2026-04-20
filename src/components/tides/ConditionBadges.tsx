import { Baby, Waves, Fish, Anchor } from "lucide-react";

export function ConditionBadges({ currentHeight, trend }: { currentHeight: number; trend: "rising" | "falling" }) {
  const badges: { icon: typeof Baby; title: string; desc: string; tone: string }[] = [];

  if (currentHeight <= 0.4) {
    badges.push({
      icon: Baby,
      title: "Piscinas Formadas",
      desc: "Ideal para crianças e mergulho leve.",
      tone: "bg-nature-light border-nature/30 text-nature",
    });
  } else {
    badges.push({
      icon: Waves,
      title: "Mar Aberto",
      desc: "Atenção: sem piscinas naturais agora.",
      tone: "bg-ocean-light border-ocean/30 text-ocean",
    });
  }

  badges.push({
    icon: Fish,
    title: trend === "rising" ? "Pesca: enchente favorável" : "Pesca: vazante ativa",
    desc:
      trend === "rising"
        ? "Peixes seguem a água entrando — ótimo para tainha e robalo."
        : "Peixes saem com a água — bom momento para arremesso na barra.",
    tone: "bg-ocean-light border-ocean/30 text-ocean-deep",
  });

  badges.push({
    icon: Anchor,
    title: trend === "rising" ? "Barqueiros: atenção correnteza" : "Janela tranquila p/ embarcar",
    desc: "Confira o pico antes de planejar o passeio.",
    tone: "bg-sand border-border text-foreground",
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {badges.map((b, i) => {
        const Icon = b.icon;
        return (
          <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${b.tone}`}>
            <Icon className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">{b.title}</p>
              <p className="text-[11px] opacity-80 leading-snug">{b.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
