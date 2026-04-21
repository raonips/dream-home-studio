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
}

const SimilarProperties = ({ currentId, condominioSlug, location, propertyType, price }: Props) => {
  const [items, setItems] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchSimilar = async () => {
      setLoading(true);
      const minPrice = price ? price * 0.7 : 0;
      const maxPrice = price ? price * 1.3 : Number.MAX_SAFE_INTEGER;

      let results: PropertyData[] = [];

      // Priority 1: same condominio, ±30% price
      if (condominioSlug) {
        let q = supabase
          .from("properties")
          .select("*")
          .neq("id", currentId)
          .eq("status", "active")
          .eq("condominio_slug", condominioSlug)
          .limit(4);
        if (price) q = q.gte("price", minPrice).lte("price", maxPrice);
        const { data } = await q;
        if (data) results = data as PropertyData[];
      }

      // Priority 2: same location + same property_type, ±30% price
      if (results.length < 3 && location) {
        const need = 4 - results.length;
        let q = supabase
          .from("properties")
          .select("*")
          .neq("id", currentId)
          .eq("status", "active")
          .ilike("location", `%${location}%`)
          .limit(need + results.length);
        if (propertyType) q = q.eq("property_type", propertyType);
        if (price) q = q.gte("price", minPrice).lte("price", maxPrice);
        const { data } = await q;
        if (data) {
          const existing = new Set(results.map(r => r.id));
          for (const p of data as PropertyData[]) {
            if (!existing.has(p.id) && results.length < 4) results.push(p);
          }
        }
      }

      // Final fallback: any active property of same type
      if (results.length < 3 && propertyType) {
        const { data } = await supabase
          .from("properties")
          .select("*")
          .neq("id", currentId)
          .eq("status", "active")
          .eq("property_type", propertyType)
          .limit(4);
        if (data) {
          const existing = new Set(results.map(r => r.id));
          for (const p of data as PropertyData[]) {
            if (!existing.has(p.id) && results.length < 4) results.push(p);
          }
        }
      }

      if (!cancelled) {
        setItems(results.slice(0, 4));
        setLoading(false);
      }
    };
    fetchSimilar();
    return () => { cancelled = true; };
  }, [currentId, condominioSlug, location, propertyType, price]);

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
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Imóveis Similares</h2>
      <p className="text-muted-foreground mb-6">Veja outras opções que podem te interessar</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((p) => (
          <PropertyCard key={p.id} property={p} variant={p.transaction_type === "temporada" ? "temporada" : "venda"} />
        ))}
      </div>
    </section>
  );
};

export default SimilarProperties;
