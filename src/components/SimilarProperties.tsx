import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PropertyCard, { type PropertyData } from "@/components/PropertyCard";
import { Loader2 } from "lucide-react";

interface Props {
  currentId: string;
  condominioSlug?: string | null;
  location?: string | null;
  propertyType?: string | null;
  price?: number | null;
  bedrooms?: number | null;
}

const LIMIT = 3;

const SimilarProperties = ({
  currentId,
  condominioSlug,
  location,
  propertyType,
  price,
  bedrooms,
}: Props) => {
  const [items, setItems] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchSimilar = async () => {
      setLoading(true);

      // ±20% price band (fallback to wide range if price missing)
      const hasPrice = typeof price === "number" && price > 0;
      const minPrice = hasPrice ? price! * 0.8 : 0;
      const maxPrice = hasPrice ? price! * 1.2 : Number.MAX_SAFE_INTEGER;

      let resultados: PropertyData[] = [];

      // ===== FASE 1: mesmo condomínio + faixa de preço =====
      if (condominioSlug) {
        const { data: dataF1, error: errF1 } = await supabase
          .from("properties")
          .select("*")
          .eq("status", "active")
          .eq("condominio_slug", condominioSlug)
          .neq("id", currentId)
          .gte("price", minPrice)
          .lte("price", maxPrice)
          .limit(10);

        if (errF1) {
          console.error("[SimilarProperties] Fase 1 erro:", errF1);
        }
        if (dataF1) {
          resultados = dataF1 as PropertyData[];
        }
      }

      // ===== FASE 2: mesma região, condomínio diferente =====
      if (resultados.length < LIMIT && location) {
        const excludeIds = [currentId, ...resultados.map((r) => r.id)];

        let q2 = supabase
          .from("properties")
          .select("*")
          .eq("status", "active")
          .ilike("location", `%${location}%`)
          .gte("price", minPrice)
          .lte("price", maxPrice)
          .not("id", "in", `(${excludeIds.join(",")})`)
          .limit(10);

        if (condominioSlug) {
          q2 = q2.neq("condominio_slug", condominioSlug);
        }

        const { data: dataF2, error: errF2 } = await q2;

        if (errF2) {
          console.error("[SimilarProperties] Fase 2 erro:", errF2);
        }
        if (dataF2) {
          // Concatena evitando duplicatas (defesa extra)
          const seen = new Set(excludeIds);
          for (const r of dataF2 as PropertyData[]) {
            if (!seen.has(r.id)) {
              resultados.push(r);
              seen.add(r.id);
            }
          }
        }
      }

      // ===== FASE 3: ordenação por proximidade de quartos =====
      if (typeof bedrooms === "number") {
        resultados.sort((a, b) => {
          const da = Math.abs((a.bedrooms ?? 0) - bedrooms);
          const db = Math.abs((b.bedrooms ?? 0) - bedrooms);
          return da - db;
        });
      }

      const final = resultados.slice(0, LIMIT);

      if (!cancelled) {
        setItems(final);
        setLoading(false);
      }
    };

    fetchSimilar();
    return () => {
      cancelled = true;
    };
  }, [currentId, condominioSlug, location, propertyType, price, bedrooms]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="container py-12 border-t border-border">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
        Imóveis Similares
      </h2>
      <p className="text-muted-foreground mb-6">
        Seleção curada com base em condomínio, faixa de preço e perfil
      </p>

      {/* Mobile: scroll horizontal com snap */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory scroll-smooth">
        <div className="flex gap-4 pb-2">
          {items.map((p) => (
            <div
              key={p.id}
              className="snap-center shrink-0 w-[88%] first:pl-0 last:pr-0"
            >
              <PropertyCard
                property={p}
                variant={p.transaction_type === "temporada" ? "temporada" : "venda"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: grid de 3 colunas */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {items.map((p) => (
          <PropertyCard
            key={p.id}
            property={p}
            variant={p.transaction_type === "temporada" ? "temporada" : "venda"}
          />
        ))}
      </div>
    </section>
  );
};

export default SimilarProperties;
