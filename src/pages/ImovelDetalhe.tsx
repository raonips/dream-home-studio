import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Bed, Bath, Car, Maximize, MapPin, Lock,
  Camera, MessageCircle, Phone, Mail, Loader2,
  Building2, Waves, TreePine, Dumbbell, ShieldCheck,
  UtensilsCrossed, Baby, Wifi, ParkingCircle, Fence, Play,
  CheckCircle2, Share2, Heart, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { PropertyData } from "@/components/PropertyCard";
import GlobalBlocks from "@/components/GlobalBlocks";
import Lightbox from "@/components/Lightbox";
import NotFound from "@/pages/NotFound";
import BookingCalculator from "@/components/BookingCalculator";
import SmartMap from "@/components/SmartMap";
import { detailImage, cardImage } from "@/lib/imageTransform";
import SafeHtmlContent from "@/components/SafeHtmlContent";
import SimilarProperties from "@/components/SimilarProperties";

interface CondominioData {
  id: string;
  name: string;
  slug: string;
  description: string;
  hero_image: string;
  images: string[];
  infrastructure: string[] | null;
  location_filter: string;
  seo_title?: string | null;
  seo_description?: string | null;
}

interface PropertyWithSeo extends PropertyData {
  seo_title?: string | null;
  seo_description?: string | null;
  video_url?: string | null;
  cleaning_fee?: number;
  ical_url?: string;
  featured_image?: string;
}

const INFRA_ICONS: Record<string, React.ElementType> = {
  piscina: Waves,
  academia: Dumbbell,
  segurança: ShieldCheck,
  portaria: Lock,
  playground: Baby,
  churrasqueira: UtensilsCrossed,
  "área verde": TreePine,
  wifi: Wifi,
  estacionamento: ParkingCircle,
  quadra: Fence,
};

function getInfraIcon(label: string) {
  const key = label.toLowerCase().trim();
  for (const [k, Icon] of Object.entries(INFRA_ICONS)) {
    if (key.includes(k)) return Icon;
  }
  return Building2;
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId = '';
    if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v') || '';
    } else if (u.hostname.includes('youtu.be')) {
      videoId = u.pathname.slice(1);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
}

const ImovelDetalhe = () => {
  const { id, slug: slugParam } = useParams<{ id?: string; slug?: string }>();
  const identifier = slugParam || id;
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [property, setProperty] = useState<PropertyWithSeo | null>(null);
  const [condo, setCondo] = useState<CondominioData | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    nome: "",
    whatsapp: "",
    email: "",
    intencao: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [liked, setLiked] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchProperty = async () => {
      if (!identifier) {
        setLoading(false);
        return;
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      let data, error;
      if (isUuid) {
        ({ data, error } = await supabase.from("properties").select("*").eq("id", identifier).maybeSingle());
      } else {
        ({ data, error } = await supabase.from("properties").select("*").eq("slug", identifier).maybeSingle());
      }

      if (cancelled) return;

      if (!error && data) {
        const prop = data as PropertyWithSeo;
        setProperty(prop);

        if (prop.condominio_slug) {
          const { data: condoData } = await supabase
            .from("condominios")
            .select("*")
            .eq("slug", prop.condominio_slug)
            .maybeSingle();

          if (!cancelled && condoData) {
            setCondo(condoData as CondominioData);
          }
        }
      }
      if (!cancelled) setLoading(false);
    };

    fetchProperty();
    return () => { cancelled = true; };
  }, [identifier]);

  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.whatsapp.trim()) {
      toast({ title: "Preencha os campos obrigatórios", description: "Nome e WhatsApp são obrigatórios.", variant: "destructive" });
      return;
    }

    setFormLoading(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: formData.nome.trim(),
        phone: formData.whatsapp.trim(),
        email: formData.email.trim() || null,
        intention: formData.intencao || null,
        source: 'imovel_detalhe',
        message: `Interesse no imóvel: ${property?.title || ''}`,
        property_id: property?.id || null,
      } as any);

      if (error) throw error;
      setFormSubmitted(true);
    } catch (err) {
      console.error('[LeadForm] Erro ao salvar lead:', err);
      toast({ title: "Erro ao enviar", description: "Tente novamente ou entre em contato pelo WhatsApp.", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  }, [formData, property?.title, property?.id, toast]);

  const whatsappLink = property
    ? `https://wa.me/5571991089039?text=${encodeURIComponent(`Olá! Me chamo ${formData.nome.trim()} e tenho interesse no imóvel: ${property.title}. ${formData.intencao ? `Intenção: ${formData.intencao}.` : ""}`)}`
    : 'https://wa.me/5571991089039';

  if (loading) {
    return (
      <div className="container pt-32 pb-20 text-center flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!property) {
    return <NotFound />;
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const seoTitle = property.seo_title || `${property.title}${condo ? ` | ${condo.name}` : ''} - Imóveis Barra do Jacuípe`;
  const seoDescription = property.seo_description || `${property.description.slice(0, 150)}${condo ? ` | Condomínio ${condo.name}` : ''}`;

  const propertyImages = property.images?.length ? property.images : [property.image_url || '/placeholder.svg'];
  const condoImages = condo?.images?.length ? condo.images : [];
  const allImagesRaw = [...propertyImages, ...condoImages];
  const allImages = allImagesRaw.map(img => detailImage(img));
  const tags = property.tags || [];

  const shareWhatsAppUrl = `https://wa.me/?text=${encodeURIComponent(`${property.title} - Veja este imóvel: ${currentUrl}`)}`;

  const isTemporadaProperty = property.transaction_type === 'temporada' || property.transaction_type === 'ambos';
  const isUnavailable = property.status === 'sold' || property.status === 'rented';
  const unavailableLabel = property.status === 'sold' ? 'Imóvel Vendido' : 'Imóvel Alugado';
  const galleryImageClass = isUnavailable ? 'grayscale' : '';
  const hasVideo = !!(property.video_url && property.video_url.trim()) && !isUnavailable;
  const videoEmbedUrl = hasVideo ? getYouTubeEmbedUrl(property.video_url!.trim()) : null;

  const GRID_VISIBLE = 4;
  const gridImages = allImages.slice(0, hasVideo ? 3 : GRID_VISIBLE);
  const extraPhotos = allImages.length - (hasVideo ? 3 : GRID_VISIBLE);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const isCasasSoltas = condo?.slug?.includes('casas-soltas') || property.property_type === 'casa-solta';
  const infra = condo?.infrastructure || [];

  const leadFormContent = formSubmitted ? (
    <div className="text-center space-y-4 py-4">
      <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
      <h3 className="font-display text-xl font-bold text-foreground">Obrigado!</h3>
      <p className="text-sm text-muted-foreground">
        Seus dados foram salvos e um especialista da <strong>Amar Imóvel</strong> entrará em contato.
      </p>
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-lg text-base hover:bg-accent/90 transition-colors"
      >
        <MessageCircle className="h-5 w-5" />
        Falar agora pelo WhatsApp
      </a>
    </div>
  ) : (
    <>
      <h3 className="font-display text-xl font-bold text-foreground mb-1">Agendar Visita</h3>
      <p className="text-sm text-muted-foreground mb-5">Fale diretamente com o corretor responsável</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Nome Completo *" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} maxLength={100} />
        <Input placeholder="WhatsApp *" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })} />
        <Input type="email" placeholder="E-mail" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} maxLength={255} />
        <Select onValueChange={(v) => setFormData({ ...formData, intencao: v })}>
          <SelectTrigger aria-label="Qual sua intenção?"><SelectValue placeholder="Qual sua intenção?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Quero agendar uma visita">Quero agendar uma visita</SelectItem>
            <SelectItem value="Quero mais informações">Quero mais informações</SelectItem>
            <SelectItem value="Tenho interesse em financiamento">Tenho interesse em financiamento</SelectItem>
            <SelectItem value="Quero fazer uma proposta">Quero fazer uma proposta</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={formLoading} className="w-full h-12 text-base font-bold bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          {formLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
          {formLoading ? 'Salvando...' : 'Enviar Mensagem Agora'}
        </Button>
      </form>
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        <span>Seus dados estão seguros. Atendimento oficial por Amar Imóvel Consultoria Imobiliária LTDA | CRECI-08556.</span>
      </div>
    </>
  );

  const BASE = "https://barradojacuipe.com.br/imoveis";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: seoDescription,
    url: `${BASE}/${(property as any).slug || identifier}`,
    image: property.featured_image || allImages[0] || `${BASE}/images/logo-imoveis-barra-do-jacuipe-medio.png`,
    datePosted: (property as any).created_at,
    ...(isTemporadaProperty
      ? {
          offers: {
            "@type": "Offer",
            price: property.daily_rate || undefined,
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: property.daily_rate || undefined,
              priceCurrency: "BRL",
              unitText: "DAY",
            },
          },
        }
      : {
          offers: {
            "@type": "Offer",
            price: property.price || undefined,
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
          },
        }),
    about: {
      "@type": "House",
      numberOfRooms: property.bedrooms || undefined,
      numberOfBathroomsTotal: property.bathrooms || undefined,
      address: {
        "@type": "PostalAddress",
        addressLocality: property.location || "Barra do Jacuípe",
        addressRegion: "BA",
        addressCountry: "BR",
      },
      ...(property.area ? { floorSize: { "@type": "QuantitativeValue", value: property.area, unitCode: "MTK" } } : {}),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: BASE },
      { "@type": "ListItem", position: 2, name: "Imóveis à Venda", item: `${BASE}/imoveis` },
      ...(condo ? [{ "@type": "ListItem", position: 3, name: condo.name, item: `${BASE}/imoveis/condominio/${condo.slug}` }] : []),
      { "@type": "ListItem", position: condo ? 4 : 3, name: property.title },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={allImages[0] || `${window.location.origin}/images/logo-imoveis-barra-do-jacuipe-medio.png`} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <div className="pt-20 md:pt-24 pb-16">
        {/* Breadcrumbs */}
        <div className="container mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/imoveis">Imóveis à Venda</Link></BreadcrumbLink>
              </BreadcrumbItem>
              {condo && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/imoveis/condominio/${condo.slug}`}>{condo.name}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{property.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Gallery */}
        <div className="container mb-8">
          {isMobile ? (
            <div className="relative">
              <Carousel className="w-full">
                <CarouselContent>
                  {allImages.map((img, i) => (
                    <CarouselItem key={i}>
                      <div
                        className="aspect-[4/3] rounded-xl overflow-hidden relative cursor-pointer"
                        onClick={() => openLightbox(i)}
                      >
                        <img src={img} alt={`${property.title} - foto ${i + 1}`} className={`w-full h-full object-cover ${galleryImageClass}`} loading={i === 0 ? "eager" : "lazy"} {...(i === 0 ? { fetchPriority: "high" as const } : {})} />
                        {i >= propertyImages.length && condo && (
                          <Badge className="absolute top-2 left-2 bg-primary/80 text-primary-foreground text-[10px]">
                            {condo.name}
                          </Badge>
                        )}
                        {i === 0 && isUnavailable && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-destructive/90 text-destructive-foreground font-display text-2xl font-bold px-8 py-3 rounded-lg shadow-2xl rotate-[-8deg] border-4 border-destructive-foreground/20 uppercase tracking-wider">
                              {unavailableLabel}
                            </div>
                          </div>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
              <div className="absolute bottom-3 right-3 bg-foreground/60 text-primary-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">
                <Camera className="h-3 w-3" /> {allImages.length} fotos
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[480px]">
              <div
                className="col-span-2 row-span-2 rounded-xl overflow-hidden cursor-pointer relative"
                onClick={() => openLightbox(0)}
              >
                <img src={allImages[0]} alt={property.title} className={`w-full h-full object-cover hover:scale-105 transition-transform duration-500 ${galleryImageClass}`} loading="eager" fetchPriority="high" />
                {isUnavailable && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-destructive/90 text-destructive-foreground font-display text-3xl md:text-4xl font-bold px-10 py-4 rounded-lg shadow-2xl rotate-[-8deg] border-4 border-destructive-foreground/20 uppercase tracking-wider">
                      {unavailableLabel}
                    </div>
                  </div>
                )}
              </div>

              {gridImages.slice(1, 3).map((img, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden relative cursor-pointer"
                  onClick={() => openLightbox(i + 1)}
                >
                  <img src={img} alt={`${property.title} - foto ${i + 2}`} className={`w-full h-full object-cover hover:scale-105 transition-transform duration-500 ${galleryImageClass}`} loading="lazy" />
                  {(i + 1) >= propertyImages.length && condo && (
                    <Badge className="absolute top-2 left-2 bg-primary/80 text-primary-foreground text-[10px]">
                      {condo.name}
                    </Badge>
                  )}
                </div>
              ))}

              {hasVideo && videoEmbedUrl ? (
                <div className="rounded-xl overflow-hidden relative">
                  <iframe
                    src={videoEmbedUrl}
                    title="Vídeo do imóvel"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : gridImages[3] ? (
                <div
                  className="rounded-xl overflow-hidden relative cursor-pointer"
                  onClick={() => openLightbox(3)}
                >
                  <img src={gridImages[3]} alt={`${property.title} - foto 4`} className={`w-full h-full object-cover hover:scale-105 transition-transform duration-500 ${galleryImageClass}`} loading="lazy" />
                  {3 >= propertyImages.length && condo && (
                    <Badge className="absolute top-2 left-2 bg-primary/80 text-primary-foreground text-[10px]">
                      {condo.name}
                    </Badge>
                  )}
                  {extraPhotos > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openLightbox(3); }}
                      className="absolute inset-0 bg-foreground/40 flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm hover:bg-foreground/50 transition-colors"
                    >
                      <Camera className="h-5 w-5" />
                      +{extraPhotos} fotos
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden bg-muted" />
              )}

              {!hasVideo && gridImages.length < 4 && Array.from({ length: 4 - gridImages.length }).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-xl overflow-hidden bg-muted" />
              ))}
              {hasVideo && gridImages.length < 3 && Array.from({ length: 3 - gridImages.length }).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-xl overflow-hidden bg-muted" />
              ))}
            </div>
          )}
        </div>

        {/* Mobile: price + quick info + form first */}
        {isMobile && (
          <div className="container space-y-6 mb-8">
            <div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => {
                    const tagSlug = tag.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <Link key={tag} to={`/imoveis/tags/${tagSlug}`} className="bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full hover:bg-accent/20 transition-colors">
                        {tag}
                      </Link>
                    );
                  })}
                </div>
              )}
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">{property.title}</h1>
              {condo && !isCasasSoltas && (
                <Link to={`/condominio/${condo.slug}`} className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mb-2">
                  <Building2 className="h-3.5 w-3.5" /> {condo.name}
                </Link>
              )}
              {property.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                  <MapPin className="h-3.5 w-3.5" /> {property.location}
                </p>
              )}
              {isTemporadaProperty ? (
                <p className="text-2xl font-bold text-primary">
                  {property.daily_rate ? `R$ ${property.daily_rate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / diária` : "Sob consulta"}
                </p>
              ) : (
                <p className="text-2xl font-bold text-primary">{property.price_formatted || "Sob consulta"}</p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 bg-secondary rounded-xl p-4">
              <div className="text-center">
                <Bed className="h-5 w-5 mx-auto text-primary mb-1" />
                <span className="text-sm font-semibold">{property.bedrooms}</span>
                <p className="text-[10px] text-muted-foreground">Quartos</p>
              </div>
              <div className="text-center">
                <Bath className="h-5 w-5 mx-auto text-primary mb-1" />
                <span className="text-sm font-semibold">{property.bathrooms}</span>
                <p className="text-[10px] text-muted-foreground">Banheiros</p>
              </div>
              <div className="text-center">
                <Car className="h-5 w-5 mx-auto text-primary mb-1" />
                <span className="text-sm font-semibold">{property.parking}</span>
                <p className="text-[10px] text-muted-foreground">Vagas</p>
              </div>
              <div className="text-center">
                <Maximize className="h-5 w-5 mx-auto text-primary mb-1" />
                <span className="text-sm font-semibold">{property.area}</span>
                <p className="text-[10px] text-muted-foreground">m²</p>
              </div>
            </div>

            {/* Mobile Lead Form */}
            {!isUnavailable ? (
              <Card className="shadow-card border-border">
                <CardContent className="p-6">
                  {leadFormContent}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-card border-destructive/40 bg-destructive/5">
                <CardContent className="p-6 text-center space-y-3">
                  <h3 className="font-display text-xl font-bold text-destructive">{unavailableLabel}</h3>
                  <p className="text-sm text-muted-foreground">Este imóvel não está mais disponível. Confira outras opções similares abaixo.</p>
                </CardContent>
              </Card>
            )}

            {/* Mobile Share Bar */}
            <div className="flex items-center justify-center gap-6 bg-muted rounded-xl p-3">
              <button
                onClick={() => setLiked(!liked)}
                className="flex items-center justify-center h-11 w-11 rounded-full hover:bg-background transition-colors"
                aria-label="Favoritar"
              >
                <Heart className={`h-5 w-5 ${liked ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentUrl);
                  toast({ title: "Link copiado!", description: "O link foi copiado para a área de transferência." });
                }}
                className="flex items-center justify-center h-11 w-11 rounded-full hover:bg-background transition-colors"
                aria-label="Copiar link"
              >
                <Link2 className="h-5 w-5 text-muted-foreground" />
              </button>
              <a
                href={shareWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-11 w-11 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                aria-label="Compartilhar no WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        )}

        {/* Desktop layout */}
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-8">
              {/* Title + info (desktop) */}
              {!isMobile && (
                <div>
              {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag) => {
                        const tagSlug = tag.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        return (
                          <Link key={tag} to={`/imoveis/tags/${tagSlug}`} className="bg-accent/10 text-accent text-xs font-bold px-3 py-1 rounded-full hover:bg-accent/20 transition-colors">
                            {tag}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">{property.title}</h1>
                  {condo && !isCasasSoltas && (
                    <Link to={`/condominio/${condo.slug}`} className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mb-2">
                      <Building2 className="h-3.5 w-3.5" /> {condo.name}
                    </Link>
                  )}
                  {property.location && (
                    <p className="text-muted-foreground flex items-center gap-1 mb-3">
                      <MapPin className="h-4 w-4" /> {property.location}
                    </p>
                  )}
                  {isTemporadaProperty ? (
                    <p className="text-3xl font-bold text-primary">
                      {property.daily_rate ? `R$ ${property.daily_rate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / diária` : "Sob consulta"}
                    </p>
                  ) : (
                    <p className="text-3xl font-bold text-primary">{property.price_formatted || "Sob consulta"}</p>
                  )}


                  <div className="grid grid-cols-4 gap-4 mt-6 bg-secondary rounded-xl p-5">
                    <div className="text-center">
                      <Bed className="h-6 w-6 mx-auto text-primary mb-1" />
                      <span className="text-lg font-bold">{property.bedrooms}</span>
                      <p className="text-xs text-muted-foreground">Quartos</p>
                    </div>
                    <div className="text-center">
                      <Bath className="h-6 w-6 mx-auto text-primary mb-1" />
                      <span className="text-lg font-bold">{property.bathrooms}</span>
                      <p className="text-xs text-muted-foreground">Banheiros</p>
                    </div>
                    <div className="text-center">
                      <Car className="h-6 w-6 mx-auto text-primary mb-1" />
                      <span className="text-lg font-bold">{property.parking}</span>
                      <p className="text-xs text-muted-foreground">Vagas</p>
                    </div>
                    <div className="text-center">
                      <Maximize className="h-6 w-6 mx-auto text-primary mb-1" />
                      <span className="text-lg font-bold">{property.area}</span>
                      <p className="text-xs text-muted-foreground">m²</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Calculator for Temporada */}
              {isTemporadaProperty && (
                <BookingCalculator
                  propertyTitle={property.title}
                  condoName={condo?.name}
                  dailyRate={property.daily_rate || 0}
                  cleaningFee={property.cleaning_fee || 0}
                  maxGuests={(property as any).max_guests || 0}
                />
              )}

              {/* Description */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">Sobre o Imóvel</h2>
                <SafeHtmlContent
                  html={property.description}
                  className="prose-description max-w-[85ch] mx-auto"
                />
              </div>

              {/* Condo section */}
              {condo && !isCasasSoltas && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-foreground">
                        Infraestrutura do {condo.name}
                      </h2>
                      <Link to={`/condominio/${condo.slug}`} className="text-sm text-primary hover:underline">
                        Ver página completa do condomínio →
                      </Link>
                    </div>
                  </div>

                  <SafeHtmlContent
                    html={condo.description}
                    className="prose-description max-w-[85ch] mx-auto"
                  />

                  {infra.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {infra.map((item) => {
                        const Icon = getInfraIcon(item);
                        return (
                          <div
                            key={item}
                            className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border"
                          >
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Map */}
              {(property as any).latitude && (property as any).longitude && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">Localização</h2>
                  <SmartMap
                    latitude={(property as any).latitude}
                    longitude={(property as any).longitude}
                    privacy={(property as any).map_privacy || 'exact'}
                    title={property.title}
                    className="w-full h-[400px] rounded-xl border border-border"
                  />
                </div>
              )}
            </div>

            {/* Sidebar - Lead Form (desktop) */}
            {!isMobile && (
              <div className="w-full lg:w-[380px] flex-shrink-0">
                <div className="sticky top-24 space-y-3">
                  {!isUnavailable ? (
                    <Card className="shadow-card border-border">
                      <CardContent className="p-6">
                        {leadFormContent}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="shadow-card border-destructive/40 bg-destructive/5">
                      <CardContent className="p-6 text-center space-y-3">
                        <h3 className="font-display text-xl font-bold text-destructive">{unavailableLabel}</h3>
                        <p className="text-sm text-muted-foreground">Este imóvel não está mais disponível. Confira outras opções similares abaixo.</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Share Action Bar */}
                  <div className="flex items-center justify-center gap-4 bg-muted rounded-xl p-3">
                    <button
                      onClick={() => setLiked(!liked)}
                      className="flex items-center justify-center h-11 w-11 rounded-full hover:bg-background transition-colors"
                      aria-label="Favoritar"
                    >
                      <Heart className={`h-5 w-5 ${liked ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentUrl);
                        toast({ title: "Link copiado!", description: "O link foi copiado para a área de transferência." });
                      }}
                      className="flex items-center justify-center h-11 w-11 rounded-full hover:bg-background transition-colors"
                      aria-label="Copiar link"
                    >
                      <Link2 className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <a
                      href={shareWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-11 w-11 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                      aria-label="Compartilhar no WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <SimilarProperties
          currentId={property.id}
          condominioSlug={property.condominio_slug}
          location={property.location}
          propertyType={property.property_type}
          price={property.price}
          bedrooms={property.bedrooms}
        />

        <GlobalBlocks pageSlug="imovel_detail" />
      </div>

      <Lightbox images={allImages} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
};

export default ImovelDetalhe;
