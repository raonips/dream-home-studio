import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ShieldCheck, Lock, MessageCircle, Search, Loader2, Camera, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import PropertyCard, { type PropertyData } from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import GlobalBlocks from "@/components/GlobalBlocks";
import Lightbox from "@/components/Lightbox";
import SmartMap from "@/components/SmartMap";
import { heroImage as optimizeHero, cardImage } from "@/lib/imageTransform";
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
  infrastructure: string[] | null;
  condominio_tags: string[];
  location_filter: string;
  latitude?: number | null;
  longitude?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

interface TagData {
  nome: string;
  slug: string;
  icone: string;
}

const CondominioDetalhe = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [condo, setCondo] = useState<CondominioData | null>(null);
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [condoTags, setCondoTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [formData, setFormData] = useState({ name: "", whatsapp: "", search: "Casa pronta" });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data: condoData, error: condoError } = await supabase
        .from("condominios")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (cancelled) return;

      if (condoError || !condoData) {
        console.warn('[CondominioDetalhe] Condomínio não encontrado para slug:', slug);
        setLoading(false);
        return;
      }

      setCondo(condoData as CondominioData);

      // Fetch condominio_tags details
      const tagSlugs = (condoData as any).condominio_tags || [];
      if (tagSlugs.length > 0) {
        const { data: tagsData } = await supabase
          .from("condominio_tags")
          .select("nome, slug, icone")
          .in("slug", tagSlugs);
        if (!cancelled && tagsData) setCondoTags(tagsData as TagData[]);
      }

      const { data: propertiesData } = await supabase
        .from("properties")
        .select("id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate")
        .eq("condominio_slug", slug)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (propertiesData) {
        setProperties(propertiesData as PropertyData[]);
      }

      setLoading(false);
    };

    fetchData();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-24 pb-16 text-center min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!condo) {
    return (
      <div className="pt-24 pb-16 text-center min-h-screen bg-background">
        <h1 className="font-display text-3xl font-bold text-foreground mb-4">Condomínio não encontrado</h1>
        <Link to="/condominios" className="text-primary hover:underline">← Voltar para Condomínios</Link>
      </div>
    );
  }

  const isCasasSoltas = condo.slug.includes('casas-soltas');

  const seoTitle = condo.seo_title || (isCasasSoltas ? `${condo.name} - Barra do Jacuípe BA` : `Imóveis à Venda no ${condo.name} - Barra do Jacuípe BA`);
  const seoDescription = condo.seo_description || `Encontre casas e terrenos à venda no ${condo.name} em Barra do Jacuípe, Litoral Norte da Bahia. ${condo.description?.slice(0, 100) || ''}`;

  const heroImg = optimizeHero(condo.images?.[0] || condo.hero_image || '/placeholder.svg');
  const galleryImages = (condo.images || []).map(img => optimizeHero(img));

  const whatsappMsg = encodeURIComponent(`Olá, gostaria de saber mais sobre os imóveis no condomínio ${condo.name}.`);

  const BASE = "https://barradojacuipe.com.br/imoveis";

  const placeLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: condo.name,
    description: condo.description?.replace(/<[^>]+>/g, '').slice(0, 300) || '',
    url: `${BASE}/condominio/${condo.slug}`,
    image: galleryImages.length > 0 ? galleryImages[0] : undefined,
    ...(condo.latitude && condo.longitude ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: condo.latitude,
        longitude: condo.longitude,
      },
    } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Barra do Jacuípe",
      addressRegion: "BA",
      addressCountry: "BR",
    },
    ...(condoTags.length > 0 ? {
      amenityFeature: condoTags.map(t => ({
        "@type": "LocationFeatureSpecification",
        name: t.nome,
      })),
    } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: BASE },
      { "@type": "ListItem", position: 2, name: isCasasSoltas ? "Imóveis" : "Condomínios", item: `${BASE}/${isCasasSoltas ? 'imoveis' : 'condominios'}` },
      { "@type": "ListItem", position: 3, name: condo.name },
    ],
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.whatsapp.trim()) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    setFormLoading(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: formData.name.trim(),
        phone: formData.whatsapp.trim(),
        source: 'condominio_busca',
        intention: formData.search,
        message: `Busca personalizada no ${condo.name}: ${formData.search}`,
        condominio_id: condo.id,
      } as any);

      if (error) throw error;
      setFormSubmitted(true);
    } catch (err) {
      console.error('[LeadForm] Erro ao salvar lead:', err);
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const GRID_MAX = 6;
  const gridPhotos = galleryImages.slice(0, GRID_MAX);
  const extraPhotos = galleryImages.length - GRID_MAX;

  const vendaProps = properties.filter((p: any) => !p.transaction_type || p.transaction_type === 'venda' || p.transaction_type === 'ambos');
  const temporadaProps = properties.filter((p: any) => p.transaction_type === 'temporada' || p.transaction_type === 'ambos');

  const whatsappLink = `https://wa.me/5571991089039?text=${encodeURIComponent(`Olá! Me chamo ${formData.name.trim()} e busco: ${formData.search} no ${condo.name}.`)}`;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={heroImg !== '/placeholder.svg' ? heroImg : `${window.location.origin}/images/logo-imoveis-barra-do-jacuipe-medio.png`} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(placeLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-end">
        <img
          src={heroImg}
          alt={`Vista do ${condo.name}`}
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-foreground/10" />
        <div className="relative container pb-10 md:pb-14 z-10">
          <Breadcrumb>
            <BreadcrumbList className="text-primary-foreground/70">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-primary-foreground/70 hover:text-primary-foreground"><Link to="/">Início</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-primary-foreground/50" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-primary-foreground/70 hover:text-primary-foreground"><Link to={isCasasSoltas ? "/imoveis" : "/condominios"}>{isCasasSoltas ? 'Imóveis' : 'Condomínios'}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-primary-foreground/50" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary-foreground">{condo.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-3 drop-shadow-lg">
            {isCasasSoltas ? condo.name : `Imóveis à Venda no ${condo.name}`}
          </h1>
          {!isCasasSoltas && (
            <p className="text-primary-foreground/85 text-base md:text-lg max-w-2xl">
              Descubra o privilégio de morar em um dos endereços mais cobiçados do Litoral Norte. Segurança, natureza e infraestrutura completa.
            </p>
          )}
        </div>
      </section>

      {/* Infrastructure + Description */}
      <section className="py-12 md:py-16 bg-secondary">
        <div className="container">
          {condoTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {condoTags.map((tag) => (
                <span key={tag.slug} className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full">
                  {tag.icone && <RenderIcon name={tag.icone} className="h-4 w-4" />}
                  {tag.nome}
                </span>
              ))}
            </div>
          )}
          <div
className="prose prose-description max-w-[85ch] mx-auto text-center break-words whitespace-normal overflow-hidden"
            style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: condo.description || "<p>Condomínio fechado com infraestrutura completa, segurança 24h e localização privilegiada.</p>" }}
          />
        </div>
      </section>

      {/* Photo Gallery */}
      {galleryImages.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
          <div className="container">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Fotos do {condo.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gridPhotos.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => openLightbox(i)}
                >
                  <img
                    src={img}
                    alt={`${condo.name} - foto ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {i === gridPhotos.length - 1 && extraPhotos > 0 && (
                    <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm group-hover:bg-foreground/50 transition-colors">
                      <Camera className="h-5 w-5" />
                      +{extraPhotos} fotos
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Map */}
      {condo.latitude && condo.longitude && (
        <section className="py-12 md:py-16 bg-secondary">
          <div className="container">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Localização do {condo.name}
            </h2>
            <SmartMap
              latitude={condo.latitude}
              longitude={condo.longitude}
              privacy="exact"
              title={condo.name}
              className="w-full h-[450px] rounded-xl border border-border"
            />
          </div>
        </section>
      )}

      {/* Properties for Sale */}
      <section className="py-14 md:py-20 bg-muted">
        <div className="container">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Imóveis para Comprar no {condo.name}
          </h2>
          {vendaProps.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendaProps.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-card rounded-xl max-w-xl mx-auto border border-border">
              <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-4" />
              <p className="font-display text-lg font-semibold text-foreground mb-2">Imóveis sob consulta restrita</p>
              <p className="text-muted-foreground text-sm mb-4">Fale com um consultor para acesso exclusivo.</p>
              <a href={`https://wa.me/5571991089039?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors">
                <MessageCircle className="h-4 w-4" /> Falar com Consultor
              </a>
            </div>
          )}
        </div>
      </section>

      {temporadaProps.length > 0 && (
        <section className="py-14 md:py-20 bg-background">
          <div className="container">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
              Casas para Temporada no {condo.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {temporadaProps.map((p) => (
                <PropertyCard key={`temp-${p.id}`} property={p} variant="temporada" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lead Capture */}
      <section className="py-14 md:py-20 bg-navy text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Não encontrou o imóvel ideal no {condo.name}?
            </h2>
            <p className="text-primary-foreground/80 text-sm md:text-base leading-relaxed">
              Temos acesso a todos os imóveis da região, incluindo oportunidades <strong>Off-Market</strong> (não anunciadas publicamente por questões de privacidade dos proprietários) e parcerias estratégicas. Diga-nos o que procura e faremos uma curadoria exclusiva para você.
            </p>
          </div>

          {formSubmitted ? (
            <div className="max-w-2xl mx-auto text-center bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-8 border border-primary-foreground/20 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
              <h3 className="font-display text-xl font-bold">Obrigado!</h3>
              <p className="text-primary-foreground/80 text-sm">
                Seus dados foram salvos e um especialista da <strong>Amar Imóvel</strong> entrará em contato.
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3.5 px-8 rounded-lg text-base hover:bg-accent/90 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Falar agora pelo WhatsApp
              </a>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="max-w-2xl mx-auto bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-primary-foreground/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Seu nome"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-primary-foreground text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="tel"
                  placeholder="(71) 99999-9999"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg bg-primary-foreground text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <select
                value={formData.search}
                onChange={(e) => setFormData({ ...formData, search: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-primary-foreground text-foreground text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Casa pronta">Casa pronta para morar</option>
                <option value="Terreno">Terreno</option>
                <option value="Casa em construção">Casa em construção</option>
              </select>
              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3.5 rounded-lg text-base hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {formLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                {formLoading ? 'Salvando...' : 'Solicitar Busca Personalizada'}
              </button>
            </form>
          )}
        </div>
      </section>

      <GlobalBlocks pageSlug="condominio_detail" />

      {/* Trust Footer */}
      <section className="py-8 bg-muted">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Lock className="h-4 w-4" />
            <span>Atendimento e Curadoria por <strong className="text-foreground">Amar Imóvel Consultoria Imobiliária LTDA</strong></span>
          </div>
        </div>
      </section>

      <Lightbox images={galleryImages} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
};

export default CondominioDetalhe;
