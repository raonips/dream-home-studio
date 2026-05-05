import { useEffect, useState, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import SafeImage from "@/components/SafeImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight, Loader2, Bed, Bath, Maximize } from "lucide-react";

interface PropertyData {
  id: string;
  title: string | null;
  slug: string | null;
  featured_image: string | null;
  image_url: string | null;
  price_formatted: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  location: string | null;
  transaction_type: string | null;
}

const PropertyCardInPost = ({ propertyId }: { propertyId: string }) => {
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("properties")
      .select("id, title, slug, featured_image, image_url, price_formatted, bedrooms, bathrooms, area, location, transaction_type")
      .eq("id", propertyId)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        setProperty(data);
        setLoading(false);
      });
  }, [propertyId]);

  if (loading) {
    return (
      <div className="my-6 mx-2 flex items-center justify-center py-8 rounded-xl border bg-muted/30">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!property) return null;

  const image = property.featured_image || property.image_url;
  const transactionLabel = property.transaction_type === "venda" ? "Venda" : property.transaction_type === "temporada" ? "Temporada" : property.transaction_type;
  
  const transactionPath = property.transaction_type === "venda" ? "venda" : property.transaction_type === "temporada" ? "temporada" : "venda";

  return (
    <div className="my-6 mx-2 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden not-prose">
      <Link
        to={`/imoveis/${transactionPath}/${property.slug}`}
        className="flex flex-col sm:flex-row gap-0 no-underline text-foreground"
      >
        {image && (
          <div className="sm:w-44 sm:min-h-[130px] flex-shrink-0">
            <SafeImage
              src={image}
              alt={property.title || "Imóvel"}
              className="w-full h-44 sm:h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 p-4 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-base m-0">{property.title || "Imóvel"}</h4>
            {transactionLabel && (
              <Badge variant="secondary" className="text-xs capitalize">
                {transactionLabel}
              </Badge>
            )}
          </div>
          {property.location && (
            <p className="text-sm text-muted-foreground m-0">{property.location}</p>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            {property.bedrooms != null && (
              <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{property.bedrooms}</span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms}</span>
            )}
            {property.area != null && (
              <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{property.area}m²</span>
            )}
          </div>
          {property.price_formatted && (
            <p className="font-semibold text-primary text-sm m-0">{property.price_formatted}</p>
          )}
          <span className="text-primary text-sm font-medium flex items-center gap-1 mt-1">
            Ver Detalhes <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </div>
  );
};

export default memo(PropertyCardInPost);
