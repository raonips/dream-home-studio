import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import PropertyCard, { type PropertyData } from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface TagData {
  id: string;
  nome: string;
  slug: string;
  descricao_seo: string;
}

const TagPage = () => {
  const { tagSlug } = useParams<{ tagSlug: string }>();
  const [tag, setTag] = useState<TagData | null>(null);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tagSlug) return;
    let cancelled = false;

    const fetch = async () => {
      // Fetch the tag info
      const { data: tagData } = await supabase
        .from('tags')
        .select('id,nome,slug,descricao_seo')
        .eq('slug', tagSlug)
        .maybeSingle();

      if (cancelled) return;
      if (tagData) setTag(tagData as TagData);

      // Fetch all active properties and filter client-side by tag
      const tagName = tagData?.nome || tagSlug;
      const { data: props } = await supabase
        .from('properties')
        .select("id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate")
        .eq('status', 'active')
        .contains('tags', [tagName])
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (props) setProperties(props as PropertyData[]);
      setLoading(false);
    };

    fetch();
    return () => { cancelled = true; };
  }, [tagSlug]);

  const { visibleItems, sentinelRef, hasMore } = useInfiniteScroll(properties);

  const displayName = tag?.nome || tagSlug?.replace(/-/g, ' ') || '';
  const seoTitle = `Imóveis com ${displayName} em Barra do Jacuípe BA`;
  const seoDesc = `Encontre casas e imóveis com ${displayName} em Barra do Jacuípe, Litoral Norte da Bahia. Confira opções de alto padrão com esta característica.`;

  const BASE = "https://barradojacuipe.com.br/imoveis";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: BASE },
      { "@type": "ListItem", position: 2, name: "Imóveis", item: `${BASE}/imoveis` },
      { "@type": "ListItem", position: 3, name: displayName },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={`${BASE}/tags/${tagSlug}`} />
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <div className="pt-20 md:pt-24 pb-16 md:pb-24 bg-background min-h-screen">
        <div className="container">
          <div className="mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/imoveis">Imóveis</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* H1 - Top of sandwich */}
          <div className="mb-10 md:mb-14">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Imóveis com {displayName} em Barra do Jacuípe
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              Veja todos os imóveis disponíveis com a característica "{displayName}" no Litoral Norte da Bahia.
            </p>
          </div>

          {/* Grid - Middle of sandwich */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
              <p className="text-muted-foreground text-lg">
                Nenhum imóvel encontrado com a característica "{displayName}".
              </p>
              <Link to="/imoveis" className="inline-block mt-4 text-primary font-semibold hover:underline">
                Ver todos os imóveis
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleItems.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
              {hasMore && (
                <div ref={sentinelRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PropertyCardSkeleton key={`skel-${i}`} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* SEO Description - Bottom of sandwich */}
          {tag?.descricao_seo && (
            <div className="mt-12 md:mt-16">
              <SafeHtmlContent
                html={tag.descricao_seo}
                className="prose-description max-w-[85ch] mx-auto"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TagPage;
