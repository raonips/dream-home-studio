import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SmartSearch from "@/components/SmartSearch";
import SafeImage from "@/components/SafeImage";
import ResponsiveImage from "@/components/ResponsiveImage";
import { type PropertyData } from "@/components/PropertyCard";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface GuiaPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  imagem_destaque: string | null;
  imagem_destaque_mobile: string | null;
  published_at: string | null;
  categoria_id: string | null;
  tags: string[];
}

interface GuiaCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  icone: string | null;
  imagem: string | null;
  imagem_mobile: string | null;
}

/* ── Category style map: icon + gradient color ── */
const categoryStyle: Record<string, { icon: React.ReactNode; gradient: string }> = {
  default: { icon: <MapPin className="h-10 w-10 text-white" />, gradient: "from-primary/80 to-primary" },
};

const getCategoryStyle = (slug: string) =>
  categoryStyle[slug] ?? categoryStyle.default;

const categoryImages: Record<string, string> = {
  gastronomia: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  praias: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
  servicos: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80",
  turismo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
  lazer: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&q=80",
  cultura: "https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=600&q=80",
  natureza: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
  mercados: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80",
  restaurantes: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
  padarias: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  saude: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80",
  hospedagem: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  imoveis: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
};

const getFallbackImage = (slug: string) =>
  categoryImages[slug] ?? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80";

const GuiaHome = () => {
  const [posts, setPosts] = useState<GuiaPost[]>([]);
  const [categorias, setCategorias] = useState<GuiaCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [propsLoading, setPropsLoading] = useState(true);
  // searchQuery state removed — SmartSearch handles it internally
  const settings = useSiteSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [postsRes, catRes] = await Promise.all([
        supabase
          .from("guia_posts")
          .select("id, titulo, slug, resumo, imagem_destaque, imagem_destaque_mobile, published_at, categoria_id, tags")
          .eq("status", "publicado")
          .order("published_at", { ascending: false })
          .limit(6),
        supabase
          .from("guia_categorias")
          .select("*")
          .order("ordem", { ascending: true }),
      ]);
      setPosts(postsRes.data ?? []);
      const allCats = catRes.data ?? [];
      // Prioriza categorias marcadas como destaque; fallback: 6 primeiras por ordem
      const featured = allCats.filter((c: any) => c.is_featured === true);
      setCategorias((featured.length > 0 ? featured : allCats).slice(0, 6));
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchProps = async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate")
        .eq("status", "active")
        .eq("is_featured", true)
        .limit(8);
      if (!cancelled) {
        setProperties((data as PropertyData[]) ?? []);
        setPropsLoading(false);
      }
    };
    fetchProps();
    return () => { cancelled = true; };
  }, []);

  const getCategoriaName = (id: string | null) =>
    categorias.find((c) => c.id === id)?.nome ?? "";


  /* ── Bento grid sizing: first 2 items are large, rest are smaller ── */
  const getBentoClass = (index: number, total: number) => {
    if (total <= 2) return "col-span-1";
    if (index === 0) return "col-span-2 row-span-1 md:col-span-1";
    if (index === 1) return "col-span-2 row-span-1 md:col-span-1";
    return "col-span-1";
  };

  return (
    <>
      <Helmet>
        <title>{settings.site_title}</title>
        <meta name="description" content={settings.site_description} />
        <meta name="keywords" content={settings.site_keywords} />
      </Helmet>

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative h-[85vh] min-h-[560px] max-h-[800px] overflow-hidden">
      {/* Background — using <picture> + <img> for LCP discoverability */}
        {(settings.hero_bg_desktop || settings.hero_bg_mobile) ? (
          <picture>
            {settings.hero_bg_mobile && settings.hero_bg_mobile !== settings.hero_bg_desktop && (
              <source media="(max-width: 768px)" srcSet={settings.hero_bg_mobile} />
            )}
            <img
              src={settings.hero_bg_desktop || settings.hero_bg_mobile}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              width={1920}
              height={1080}
              fetchPriority="high"
              decoding="sync"
              loading="eager"
            />
          </picture>
        ) : (
          <div className="absolute inset-0 bg-[#0c2d48]" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />

        {/* Centered content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          {/* Logo text — large cursive style via Playfair Display */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-xl mb-2 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {settings.hero_title || "Barra do Jacuípe"}
          </h1>
          <p className="text-lg md:text-xl text-white/90 drop-shadow-md max-w-xl italic mb-10">
            {settings.hero_subtitle || "Descubra as maravilhas naturais e culturais de Barra do Jacuípe!"}
          </p>

          {/* Search bar — Smart autocomplete */}
          <div className="w-full max-w-2xl">
            <SmartSearch variant="hero" placeholder="Buscar locais, imóveis, categorias..." />
          </div>
        </div>
      </section>

      {/* ════════════════ CATEGORIAS — Bento Grid ════════════════ */}
      {categorias.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container">
            <div className={`grid gap-4 ${
              categorias.length <= 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-2 md:grid-cols-4"
            }`}>
              {/* First 2 items: large (span 2 cols on mobile, 1 on md+) in a 2-col top row on md */}
              {categorias.slice(0, 2).map((cat, i) => (
                <Link
                  key={cat.id}
                  to={`/guia/categoria/${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl col-span-2 md:col-span-2 aspect-[16/7]"
                >
                  <ResponsiveImage
                    src={cat.imagem || getFallbackImage(cat.slug)}
                    mobileSrc={cat.imagem_mobile}
                    alt={cat.nome}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 group-hover:from-black/80 transition-colors duration-300" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                    {cat.icone ? (
                      <span className="text-4xl drop-shadow-lg">{cat.icone}</span>
                    ) : (
                      <MapPin className="h-12 w-12 text-white drop-shadow-lg" />
                    )}
                    <span className="text-white font-bold text-lg md:text-xl drop-shadow-lg">
                      {cat.nome}
                    </span>
                  </div>
                </Link>
              ))}

              {/* Remaining items: smaller cards, 4 per row on desktop */}
              {categorias.slice(2).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/guia/categoria/${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl aspect-[4/3]"
                >
                  <ResponsiveImage
                    src={cat.imagem || getFallbackImage(cat.slug)}
                    mobileSrc={cat.imagem_mobile}
                    alt={cat.nome}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-colors duration-300" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
                    {cat.icone ? (
                      <span className="text-3xl drop-shadow-lg">{cat.icone}</span>
                    ) : (
                      <MapPin className="h-10 w-10 text-white drop-shadow-lg" />
                    )}
                    <span className="text-white font-semibold text-sm md:text-base drop-shadow-lg text-center">
                      {cat.nome}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════ POSTS RECENTES ════════════════ */}
      {!loading && posts.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Últimas Dicas & Novidades
              </h2>
              <p className="text-foreground/60 mt-2">Conteúdo selecionado sobre a região</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.id} to={`/${post.slug}`} className="group">
                  <div className="overflow-hidden h-full bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-card-hover transition-shadow">
                    {post.imagem_destaque && (
                      <div className="aspect-video overflow-hidden rounded-t-xl">
                        <ResponsiveImage
                          src={post.imagem_destaque}
                          mobileSrc={post.imagem_destaque_mobile}
                          alt={post.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {post.categoria_id && (
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {getCategoriaName(post.categoria_id)}
                        </Badge>
                      )}
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.titulo}
                      </h3>
                      {post.resumo && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {post.resumo}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium">
                        Ler mais <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {loading && (
        <section className="py-16">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </section>
      )}

      {/* ════════════════ CTA BANNER ════════════════ */}
      <section className="mt-20 md:mt-28 relative h-[340px] md:h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80"
          alt="Barra do Jacuípe lifestyle"
          className="absolute inset-0 w-full h-full object-cover"
          width={1600}
          height={400}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--navy))]/70 via-[hsl(var(--navy))]/40 to-transparent" />
        <div className="relative z-10 h-full flex flex-col items-start justify-center container">
          <p className="text-white/70 text-sm tracking-[0.25em] uppercase font-medium mb-3">
            Investimento & Lifestyle
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold text-white max-w-lg leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            O estilo de vida que você merece
          </h2>
          <Link
            to="/imoveis"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white font-medium hover:bg-white/25 transition-all duration-300"
          >
            Explorar Catálogo Completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ════════════════ VITRINE CURADA ════════════════ */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground font-medium mb-2">
                Seleção exclusiva
              </p>
              <h2
                className="text-2xl md:text-3xl font-bold text-foreground"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Oportunidades em Destaque
              </h2>
            </div>
            <Link
              to="/imoveis"
              className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {propsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-3xl bg-muted h-[380px]" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-3xl border border-border/50">
              <p className="text-muted-foreground">Nenhum imóvel em destaque no momento.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {properties.slice(0, 8).map((property) => (
                  <Link
                    key={property.id}
                    to={`/imoveis/${property.transaction_type === 'temporada' ? 'temporada' : 'venda'}/${property.slug || property.id}`}
                    className="group block"
                  >
                    <div className="rounded-3xl overflow-hidden bg-card border border-border/40 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-500">
                      {/* Image */}
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <img
                          src={property.thumbnail_url || property.image_url || "/placeholder.svg"}
                          alt={property.title || "Imóvel"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />
                        {property.highlight_tag && (
                          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-foreground shadow-sm">
                            {property.highlight_tag}
                          </span>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-5">
                        <h3 className="font-semibold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors">
                          {property.title}
                        </h3>
                        {property.location && (
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-1">{property.location}</span>
                          </p>
                        )}
                        <p
                          className="mt-3 text-lg font-bold text-primary"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {property.price_formatted || (property.price ? `R$ ${property.price.toLocaleString("pt-BR")}` : "Consulte")}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-12 md:hidden">
                <Link
                  to="/imoveis"
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Ver todos os imóveis <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ════════════════ SEO AUTHORITY BLOCK ════════════════ */}
      <section className="py-16 md:py-20 bg-muted/20 border-t border-border/50">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Por que Barra do Jacuípe?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto prose-description">
            <div>
              <p>
                Barra do Jacuípe é um dos destinos mais encantadores do litoral norte da Bahia,
                localizada a apenas 40 km de Salvador. Aqui, o <strong>Rio Jacuípe encontra o mar</strong>,
                criando um cenário singular de águas calmas, coqueirais e uma faixa de areia dourada que
                se estende por quilômetros.
              </p>
              <p>
                A região é conhecida pelo clima acolhedor, pela gastronomia baiana autêntica e por uma
                infraestrutura que combina tranquilidade com conveniência.
              </p>
            </div>
            <div>
              <p>
                Com uma comunidade acolhedora e serviços em constante expansão, Barra do Jacuípe
                oferece <strong>qualidade de vida incomparável</strong>. Caminhadas na praia ao amanhecer,
                passeios de stand-up paddle no rio e jantares à beira-mar fazem parte do cotidiano.
              </p>
              <p>
                Explore nosso guia completo e descubra tudo o que essa joia do litoral norte tem a oferecer.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default GuiaHome;
