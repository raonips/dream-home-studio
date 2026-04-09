import { forwardRef } from "react";
import { Bed, Bath, Car, Maximize, MessageCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import LazyImage from "@/components/LazyImage";
import { cardImage } from "@/lib/imageTransform";

export interface PropertyData {
  id: string;
  title: string;
  description?: string;
  price: number;
  price_formatted: string;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  tags: string[] | null;
  highlight_tag: string;
  image_url: string;
  images?: string[] | null;
  partnership: string;
  property_type: string;
  condominio_slug: string | null;
  status: string;
  transaction_type?: string;
  max_guests?: number;
  daily_rate?: number;
  thumbnail_url?: string;
  slug?: string;
}

interface PropertyCardProps {
  property: PropertyData;
  variant?: "venda" | "temporada";
  eager?: boolean;
}

const PropertyCard = forwardRef<HTMLDivElement, PropertyCardProps>(
  ({ property, variant = "venda", eager = false }, ref) => {
    const { whatsapp_number } = useSiteSettings();
    const phone = whatsapp_number || '5571991089039';
    const coverImage = property.thumbnail_url || cardImage(property.images?.[0] || property.image_url || '/placeholder.svg');
    const isTemporada = variant === "temporada";
    const dailyRate = property.daily_rate || 0;
    const maxGuests = property.max_guests || 0;

    const priceDisplay = isTemporada
      ? dailyRate > 0
        ? `R$ ${dailyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / diária`
        : "Sob consulta / diária"
      : property.price_formatted;

    return (
      <div ref={ref} className="group bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 border border-border">
        <Link to={`/imoveis/${isTemporada ? 'temporada' : 'venda'}/${property.slug || property.id}`} className="relative overflow-hidden aspect-[4/3] block cursor-pointer">
          <LazyImage
            src={coverImage}
            alt={property.title}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
            eager={eager}
          />
          {property.highlight_tag && (
            <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full z-10">
              {property.highlight_tag}
            </span>
          )}
          {isTemporada && (
            <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full z-10">
              Temporada
            </span>
          )}
          {property.partnership && !isTemporada && (
            <span className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm text-xs font-semibold text-foreground px-2.5 py-1 rounded-full z-10">
              {property.partnership}
            </span>
          )}
        </Link>

        <div className="p-5">
          <p className="text-2xl font-bold text-primary mb-1">{priceDisplay}</p>
          <h3 className="font-display text-lg font-semibold text-foreground mb-1 leading-snug">
            {property.title}
          </h3>
          <p className="text-sm text-foreground/60 mb-4">{property.location}</p>

          <div className="flex items-center gap-4 text-foreground/70 text-sm mb-5 border-t border-border pt-4">
            <span className="flex items-center gap-1.5"><Bed className="h-4 w-4" /> {property.bedrooms}</span>
            <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" /> {property.bathrooms}</span>
            {isTemporada && maxGuests > 0 ? (
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {maxGuests} hósp.</span>
            ) : (
              <span className="flex items-center gap-1.5"><Car className="h-4 w-4" /> {property.parking}</span>
            )}
            <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4" /> {property.area} m²</span>
          </div>

          <div className="flex gap-3">
            <Link to={`/imoveis/${isTemporada ? 'temporada' : 'venda'}/${property.slug || property.id}`} className="flex-1 text-center bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
              Ver Detalhes
            </Link>
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-accent text-accent-foreground text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-colors"
              aria-label="Contato via WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }
);

PropertyCard.displayName = 'PropertyCard';

export default PropertyCard;
