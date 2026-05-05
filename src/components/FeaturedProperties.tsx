import { useEffect, useState } from "react";
import PropertyCard, { type PropertyData } from "./PropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";
import { supabase } from "@/integrations/supabase/client";

const DISPLAY_COUNT = 3;

const FeaturedProperties = () => {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProperties = async () => {
      // Fetch up to 12 most recent featured, then pick 3 randomly client-side
      const { data, error } = await supabase
        .from("properties")
        .select("id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate")
        .eq("status", "active")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (cancelled) return;

      let result: PropertyData[] = [];

      if (!error && data && data.length > 0) {
        // Shuffle and pick 3
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        result = shuffled.slice(0, DISPLAY_COUNT) as PropertyData[];
      } else if (!error) {
        // Fallback: latest 3
        const { data: fallback } = await supabase
          .from("properties")
          .select("id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(DISPLAY_COUNT);
        if (!cancelled && fallback) result = fallback as PropertyData[];
      }

      if (!cancelled) {
        setProperties(result);
        setLoading(false);
      }
    };

    fetchProperties();
    return () => { cancelled = true; };
  }, []);

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
