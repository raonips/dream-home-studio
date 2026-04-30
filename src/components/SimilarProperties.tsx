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

const normalizeText = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getRegionTerms = (value?: string | null) =>
  (value || "")
    .split(/[-,|]/)
    .map(normalizeText)
    .filter((term) =>
      term.length >= 4 &&
      !term.includes("condominio") &&
      !["bahia", "brasil"].includes(term)
    );

const isSameRegion = (candidateLocation?: string | null, regionTerms: string[] = []) => {
  if (regionTerms.length === 0) return true;

  const normalizedLocation = normalizeText(candidateLocation);
  return regionTerms.some((term) => normalizedLocation.includes(term));
};

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
      const regionTerms = getRegionTerms(location);

      let resultados: PropertyData[] = [];
      const isCasasSoltas = !!condominioSlug && condominioSlug.includes('casas-soltas');

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

        // Para "Casas Soltas", se a faixa de preço não trouxer 3, amplia SEM sair do mesmo slug
        if (isCasasSoltas && resultados.length < LIMIT) {
          const { data: dataF1b, error: errF1b } = await supabase
            .from("properties")
            .select("*")
            .eq("status", "active")
            .eq("condominio_slug", condominioSlug)
            .neq("id", currentId)
            .limit(20);

          if (errF1b) {
            console.error("[SimilarProperties] Fase 1b erro:", errF1b);
          }
          if (dataF1b) {
            const seen = new Set([currentId, ...resultados.map((r) => r.id)]);
            for (const r of dataF1b as PropertyData[]) {
              if (!seen.has(r.id)) {
                resultados.push(r);
                seen.add(r.id);
              }
            }
          }
        }
      }

      // ===== FASE 2: mesma região, condomínio diferente (NÃO aplicável a Casas Soltas) =====
      if (!isCasasSoltas && resultados.length < LIMIT) {
        const { data: dataF2, error: errF2 } = await supabase
          .from("properties")
          .select("*")
          .eq("status", "active")
          .neq("id", currentId)
          .gte("price", minPrice)
          .lte("price", maxPrice)
          .limit(30);

        if (errF2) {
          console.error("[SimilarProperties] Fase 2 erro:", errF2);
        }
        if (dataF2) {
          const seen = new Set([currentId, ...resultados.map((r) => r.id)]);
          for (const r of dataF2 as PropertyData[]) {
            const sameCondo = condominioSlug && r.condominio_slug === condominioSlug;
            if (!seen.has(r.id) && !sameCondo && isSameRegion(r.location, regionTerms)) {
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
