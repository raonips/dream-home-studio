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

      // Cascade requires price to define the ±20% band.
      const minPrice = price ? price * 0.8 : null;
      const maxPrice = price ? price * 1.2 : null;

      const collected: PropertyData[] = [];
      const seen = new Set<string>([currentId]);

      const pushUnique = (rows: PropertyData[] | null) => {
        if (!rows) return;
        for (const r of rows) {
          if (seen.has(r.id)) continue;
          seen.add(r.id);
          collected.push(r);
        }
      };

      // Phase 1 — same condominio + ±20% price
      if (condominioSlug && minPrice !== null && maxPrice !== null) {
        const { data } = await supabase
          .from("properties")
          .select("*")
          .neq("id", currentId)
          .eq("status", "active")
          .eq("condominio_slug", condominioSlug)
          .gte("price", minPrice)
          .lte("price", maxPrice)
          .limit(10);
        pushUnique(data as PropertyData[] | null);
      }

      // Phase 2 — same location, different condominio + ±20% price
      if (collected.length < LIMIT && location && minPrice !== null && maxPrice !== null) {
        let q = supabase
          .from("properties")
          .select("*")
          .neq("id", currentId)
          .eq("status", "active")
          .ilike("location", `%${location}%`)
          .gte("price", minPrice)
          .lte("price", maxPrice)
          .limit(10);
        if (condominioSlug) q = q.neq("condominio_slug", condominioSlug);
        const { data } = await q;
        pushUnique(data as PropertyData[] | null);
      }

      // Phase 3 — tie-break by closest bedroom count
      const ranked = [...collected].sort((a, b) => {
        if (bedrooms == null) return 0;
        const da = Math.abs((a.bedrooms ?? 0) - bedrooms);
        const db = Math.abs((b.bedrooms ?? 0) - bedrooms);
        return da - db;
      });

      if (!cancelled) {
        setItems(ranked.slice(0, LIMIT));
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
