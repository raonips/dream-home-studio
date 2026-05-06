import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import PropertyCard, { type PropertyData } from "./PropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";
import { supabase } from "@/integrations/supabase/client";

const DISPLAY_COUNT = 3;
const LISTING_COLS = "id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate";

const FeaturedProperties = () => {
  const { data: pool = [], isLoading: loading } = useQuery({
    queryKey: ["featured-properties-pool"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(LISTING_COLS)
        .eq("status", "active")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      if (data && data.length > 0) return data as PropertyData[];
      // Fallback: latest active
      const { data: fallback } = await supabase
        .from("properties")
        .select(LISTING_COLS)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(DISPLAY_COUNT);
      return (fallback ?? []) as PropertyData[];
    },
  });

  const properties = useMemo(() => {
    if (!pool.length) return [] as PropertyData[];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, DISPLAY_COUNT);
  }, [pool]);

  return (
    <section id="imoveis" className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Imóveis em Destaque
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Seleção exclusiva dos melhores imóveis disponíveis em Barra do Jacuípe e região.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: DISPLAY_COUNT }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
            <p className="text-muted-foreground text-lg">
              Nenhuma oportunidade disponível no momento. Volte em breve!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, idx) => (
              <PropertyCard key={property.id} property={property} eager={idx === 0} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProperties;
