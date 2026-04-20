import { useState } from "react";

type Persona = "family" | "surf" | "fishing";

const personaLabels: Record<Persona, string> = {
  family: "👨‍👩‍👧 Família",
  surf: "🏄‍♂️ Surf",
  fishing: "🎣 Pesca",
};

export function PersonaSummary({ currentHeight, trend }: { currentHeight: number; trend: "rising" | "falling" }) {
  const [active, setActive] = useState<Persona>("family");

  const message = (() => {
    if (active === "family") {
      return currentHeight <= 0.4
        ? "🟢 Piscinas Liberadas! Janela ideal para crianças agora."
        : "Aguarde a maré baixar abaixo de 0,4m para piscinas naturais.";
    }
    if (active === "surf") {
      return trend === "rising"
        ? "🌊 Maré enchendo — boa formação de ondas na foz."
        : "Maré secando — ondas mais limpas, fundo mais raso.";
    }
    return trend === "rising"
      ? "🐟 Vazante invertida — peixes seguem a água, ótimo p/ tainha."
      : "🐟 Vazante ativa — bom momento para arremesso na barra.";
  })();

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(Object.keys(personaLabels) as Persona[]).map((p) => (
          <button
            key={p}
            onClick={() => setActive(p)}
            className={`flex-1 rounded-full py-2 text-xs font-bold border transition-colors ${
              active === p
                ? "bg-ocean text-primary-foreground border-ocean"
                : "bg-background text-foreground hover:bg-muted"
            }`}
          >
            {personaLabels[p]}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-ocean-light p-4 border-l-4 border-ocean">
        <p className="text-sm font-bold text-ocean-deep">{message}</p>
        <p className="text-xs text-ocean-deep/80 mt-1">Dica: O melhor momento para crianças é na maré mínima (abaixo de 0,4m).</p>
      </div>
    </div>
  );
}
