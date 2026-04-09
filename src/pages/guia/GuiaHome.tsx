import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SafeImage from "@/components/SafeImage";
import PropertyCard, { type PropertyData } from "@/components/PropertyCard";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface GuiaPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  imagem_destaque: string | null;
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
}

/* ── Category placeholder images (fallback when no real photo exists) ── */
const categoryImages: Record<string, string> = {
  gastronomia: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  praias: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
  servicos: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80",
  turismo: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
  lazer: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&q=80",
  cultura: "https://images.unsplash.com/photo-1533669955142-6a73332af4db?w=600&q=80",
  natureza: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
};

const getFallbackImage = (slug: string) =>
  categoryImages[slug] ?? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80";

const GuiaHome = () => {
  const [posts, setPosts] = useState<GuiaPost[]>([]);
  const [categorias, setCategorias] = useState<GuiaCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [propsLoading, setPropsLoading] = useState(true);
  const settings = useSiteSettings();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [postsRes, catRes] = await Promise.all([
        supabase
          .from("guia_posts")
          .select("id, titulo, slug, resumo, imagem_destaque, published_at, categoria_id, tags")
          .eq("status", "publicado")
          .order("published_at", { ascending: false })
          .limit(20),
        supabase
          .from("guia_categorias")
          .select("*")
          .order("ordem", { ascending: true }),
      ]);
      setPosts(postsRes.data ?? []);
      setCategorias(catRes.data ?? []);
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

  const scrollCarousel = (dir: "left" | "right") => {
    if (!carouselRef.current) return;
    const amount = carouselRef.current.offsetWidth * 0.7;
    carouselRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <>
      <Helmet>
        <title>{settings.site_title}</title>
        <meta name="description" content={settings.site_description} />
        <meta name="keywords" content={settings.site_keywords} />
      </Helmet>

      {/* ════════════════ HERO — Ken Burns ════════════════ */}
      <section className="relative h-[70vh] min-h-[480px] max-h-[720px] overflow-hidden">
        {/* Background image with Ken Burns */}
        <div
          className="absolute inset-0 animate-ken-burns"
          style={settings.hero_bg_desktop ? {
            backgroundImage: `url(${settings.hero_bg_desktop})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } : {
            backgroundImage: "url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-end pb-12 md:pb-16">
          <div className="container">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg max-w-3xl leading-tight">
              {settings.hero_title || "Guia Local — Barra do Jacuípe"}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md">
              {settings.hero_subtitle || "Tudo o que você precisa saber sobre a região."}
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════ CATEGORIAS — Photo Cards ════════════════ */}
      {categorias.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Explore por Experiência
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categorias.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/guia/categoria/${cat.slug}`}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden"
                >
                  <img
                    src={getFallbackImage(cat.slug)}
                    alt={cat.nome}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-colors group-hover:from-black/80" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
                    {cat.icone && (
                      <span className="text-2xl mb-1">{cat.icone}</span>
                    )}
                    <span className="text-white font-semibold text-sm md:text-base text-center drop-shadow-md">
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
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Últimas Dicas & Novidades
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">
              Nenhum artigo publicado ainda. Volte em breve!
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.id} to={`/${post.slug}`} className="group">
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow border-0 shadow-card">
                    {post.imagem_destaque && (
                      <div className="aspect-video overflow-hidden">
                        <SafeImage
                          src={post.imagem_destaque}
                          alt={post.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      {post.categoria_id && (
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {getCategoriaName(post.categoria_id)}
                        </Badge>
                      )}
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.titulo}
                      </h3>
                      {post.resumo && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {post.resumo}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium">
                        Ler mais <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════ OPORTUNIDADES EM DESTAQUE — Carousel ════════════════ */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Oportunidades em Destaque
              </h2>
              <p className="text-muted-foreground mt-1">
                Imóveis selecionados na região de Barra do Jacuípe.
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollCarousel("left")}
                className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollCarousel("right")}
                className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {propsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
              <p className="text-muted-foreground">Nenhum imóvel em destaque no momento.</p>
            </div>
          ) : (
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              {properties.map((property) => (
                <div key={property.id} className="min-w-[300px] sm:min-w-[340px] snap-start flex-shrink-0">
                  <PropertyCard property={property} linkPrefix="/imoveis" />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/imoveis"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Ver Todos os Imóveis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════ SEO AUTHORITY BLOCK ════════════════ */}
      <section className="py-16 md:py-20 bg-muted/20">
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
                infraestrutura que combina tranquilidade com conveniência. Condomínios de alto padrão
                convivem harmoniosamente com a natureza exuberante, tornando o local ideal tanto para
                moradia permanente quanto para temporada.
              </p>
            </div>
            <div>
              <p>
                Com uma comunidade acolhedora e serviços em constante expansão, Barra do Jacuípe
                oferece <strong>qualidade de vida incomparável</strong>. Caminhadas na praia ao amanhecer,
                passeios de stand-up paddle no rio e jantares à beira-mar fazem parte do cotidiano
                de quem vive ou visita a região.
              </p>
              <p>
                Seja você um investidor em busca de valorização imobiliária, uma família procurando
                o refúgio perfeito ou um visitante querendo conhecer o melhor do litoral baiano,
                Barra do Jacuípe é o destino certo. Explore nosso guia completo e descubra tudo
                o que essa joia do litoral norte tem a oferecer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ CTA FINAL ════════════════ */}
      <section className="py-12 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-3">Procurando imóveis na região?</h2>
          <p className="text-muted-foreground mb-6">
            Confira nosso portfólio de casas, apartamentos e terrenos à venda e para temporada.
          </p>
          <Link
            to="/imoveis"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Ver Imóveis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default GuiaHome;
