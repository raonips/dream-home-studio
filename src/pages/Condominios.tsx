import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import CondominioCardSkeleton from "@/components/CondominioCardSkeleton";
import { supabase } from "@/integrations/supabase/client";
import GlobalBlocks from "@/components/GlobalBlocks";
import { stripHtml } from "@/lib/utils";
import { cardImage } from "@/lib/imageTransform";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { RenderIcon } from "@/components/admin/IconPicker";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface CondominioData {
  id: string;
  name: string;
  slug: string;
  description: string;
  hero_image: string;
  images: string[];
  condominio_tags: string[];
  location_filter: string;
}

interface TagData {
  nome: string;
  slug: string;
  icone: string;
}

const Condominios = () => {
  const location = useLocation();
  const [condominios, setCondominios] = useState<CondominioData[]>([]);
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchCondominios = async () => {
      const [{ data, error }, { data: tagsData }] = await Promise.all([
        supabase.from("condominios").select("id,name,slug,description,hero_image,images,condominio_tags,location_filter,thumbnail_url").order("name"),
        supabase.from("condominio_tags").select("nome, slug, icone"),
      ]);

      if (cancelled) return;
      if (!error && data) setCondominios(data as CondominioData[]);
      if (tagsData) setAllTags(tagsData as TagData[]);
      setLoading(false);
    };

    fetchCondominios();
    return () => { cancelled = true; };
  }, []);

  const { visibleItems, sentinelRef, hasMore, currentPage, totalPages } = useInfiniteScroll(condominios, {
    mobilePageSize: 4,
    desktopPageSize: 6,
  });

  return (
    <>
      <Helmet>
        <title>Condomínios em Barra do Jacuípe BA - Canto do Sol, Parque das Árvores</title>
        <meta name="description" content="Conheça os melhores condomínios fechados de Barra do Jacuípe, BA. Canto do Sol, Parque das Árvores, Aldeias e Vila do Jacuípe com segurança 24h e infraestrutura completa." />
        {currentPage < totalPages && (
          <link rel="next" href={`${location.pathname}?page=${currentPage + 1}`} />
        )}
        {currentPage > 1 && (
          <link rel="prev" href={`${location.pathname}?page=${currentPage - 1}`} />
        )}
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
                  <BreadcrumbPage>Condomínios</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Condomínios em Barra do Jacuípe
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
              Descubra os condomínios fechados mais exclusivos do Litoral Norte baiano, com segurança e infraestrutura de alto nível.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <CondominioCardSkeleton key={i} />
              ))}
            </div>
          ) : condominios.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
              <p className="text-muted-foreground text-lg">
                Nenhuma oportunidade disponível no momento. Volte em breve!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {visibleItems.map((condo) => {
                  const coverImage = (condo as any).thumbnail_url || cardImage(condo.images?.[0] || condo.hero_image || '/placeholder.svg');
                   const tagSlugs = condo.condominio_tags || [];
                   const tags = allTags.filter(t => tagSlugs.includes(t.slug));
                   const hasValidSlug = condo.slug && condo.slug.trim().length > 0;

                  return (
                    <div key={condo.id} className="bg-card rounded-xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all duration-300 group">
                      {hasValidSlug ? (
                        <Link to={`/condominio/${condo.slug}`} className="relative overflow-hidden aspect-[16/9] block cursor-pointer">
                          <img
                            src={coverImage}
                            alt={condo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                          <h2 className="absolute bottom-4 left-5 font-display text-xl md:text-2xl font-bold text-primary-foreground drop-shadow-lg">
                            {condo.name}
                          </h2>
                        </Link>
                      ) : (
                        <div className="relative overflow-hidden aspect-[16/9] block">
                          <img
                            src={coverImage}
                            alt={condo.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                          <h2 className="absolute bottom-4 left-5 font-display text-xl md:text-2xl font-bold text-primary-foreground drop-shadow-lg">
                            {condo.name}
                          </h2>
                        </div>
                      )}

                      <div className="p-5 md:p-6">
                        <p className="text-muted-foreground text-sm mb-5 leading-relaxed line-clamp-3">
                          {stripHtml(condo.description) || "Condomínio fechado com infraestrutura completa."}
                        </p>

                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-5">
                            {tags.slice(0, 4).map((tag) => (
                              <span key={tag.slug} className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                                {tag.icone && <RenderIcon name={tag.icone} className="h-3 w-3" />}
                                {tag.nome}
                              </span>
                            ))}
                          </div>
                        )}

                        {hasValidSlug ? (
                          <Link
                            to={`/condominio/${condo.slug}`}
                            className="block text-center bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Ver imóveis neste condomínio
                          </Link>
                        ) : (
                          <span className="block text-center bg-muted text-muted-foreground text-sm font-semibold py-2.5 rounded-lg">
                            Em breve
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasMore && (
                <div ref={sentinelRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <CondominioCardSkeleton key={`skel-${i}`} />
                  ))}
                </div>
              )}
              <nav className="sr-only" aria-label="Paginação">
                {Array.from({ length: totalPages }, (_, i) => (
                  <a key={i} href={`${location.pathname}?page=${i + 1}`}>
                    Página {i + 1}
                  </a>
                ))}
              </nav>
            </>
          )}

          <GlobalBlocks pageSlug="condominios_list" />
        </div>
      </div>
    </>
  );
};

export default Condominios;
