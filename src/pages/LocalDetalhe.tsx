import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Phone, Clock, Globe, ExternalLink, ArrowLeft, Camera,
  ShieldCheck, Anchor, Trees, Waves, Dumbbell, UtensilsCrossed,
  Baby, Wifi, Car, Fence, Building2, Droplets, Zap, Heart,
  Store, Pill, Flame, Sparkles, CircleDot, Ticket, Copy, Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import SmartMap from "@/components/SmartMap";
import Lightbox from "@/components/Lightbox";
import ctaBgImage from "@/assets/cta-condominio-bg.jpg";
import SafeHtmlContent from "@/components/SafeHtmlContent";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface Local {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoria: string;
  telefone: string | null;
  whatsapp: string | null;
  google_maps_link: string | null;
  imagem_destaque: string | null;
  imagem_destaque_mobile: string | null;
  imagens: string[] | null;
  endereco: string | null;
  horario_funcionamento: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  url_vendas: string | null;
  banner_publicidade: string | null;
  logo_url: string | null;
  cupom_desconto: string | null;
  valor_desconto: string | null;
}

interface AdTemplate {
  heading: string;
  subtitle: string;
  button_text: string;
  overlay_style: string;
  layout_model: string;
  custom_html: string;
}

const CouponBadge = ({ code, value }: { code: string; value: string | null }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl border border-amber-300/50 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-amber-600" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Cupom ativo</span>
        {value && (
          <span className="ml-auto text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-800/40 px-2 py-0.5 rounded-full">{value}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm font-mono font-bold text-amber-900 dark:text-amber-200 bg-white/70 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-amber-200/50 tracking-widest">
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
};

const CATEGORIA_LABELS: Record<string, string> = {
  condominio: "Condomínio",
  mercado: "Mercado",
  padaria: "Padaria",
  restaurante: "Restaurante",
  hospedagem: "Hospedagem",
  saude: "Saúde",
  gas: "Gás",
  limpeza: "Materiais de Limpeza",
  farmacia: "Farmácia",
  utilidade: "Utilidade",
};

const CATEGORIA_ICONS: Record<string, React.ElementType> = {
  condominio: Building2,
  mercado: Store,
  padaria: UtensilsCrossed,
  restaurante: UtensilsCrossed,
  hospedagem: Building2,
  saude: Heart,
  gas: Flame,
  limpeza: Sparkles,
  farmacia: Pill,
  utilidade: Zap,
};

const OVERLAY_STYLES: Record<string, string> = {
  oceanic: "from-[hsl(200,60%,12%)]/90 via-[hsl(200,50%,18%)]/80 to-[hsl(200,40%,25%)]/70",
  dark: "from-black/90 via-black/75 to-black/60",
  warm: "from-[hsl(30,40%,15%)]/90 via-[hsl(30,30%,20%)]/80 to-[hsl(30,25%,25%)]/70",
};

/* ── Infrastructure icon resolver ── */
const INFRA_ICONS: Record<string, React.ElementType> = {
  piscina: Waves,
  academia: Dumbbell,
  segurança: ShieldCheck,
  "seguranca": ShieldCheck,
  portaria: ShieldCheck,
  playground: Baby,
  churrasqueira: UtensilsCrossed,
  "área verde": Trees,
  "area verde": Trees,
  wifi: Wifi,
  estacionamento: Car,
  quadra: Fence,
  pier: Anchor,
  píer: Anchor,
  marina: Anchor,
  praia: Waves,
  água: Droplets,
  gas: Flame,
};

function getInfraIcon(label: string) {
  const key = label.toLowerCase().trim();
  for (const [k, Icon] of Object.entries(INFRA_ICONS)) {
    if (key.includes(k)) return Icon;
  }
  return CircleDot;
}

const LocalDetalhe = () => {
  const { slug } = useParams<{ slug: string }>();
  const [local, setLocal] = useState<Local | null>(null);
  const [adTemplate, setAdTemplate] = useState<AdTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("locais")
      .select("*")
      .eq("slug", slug)
      .eq("ativo", true)
      .maybeSingle()
      .then(({ data }) => {
        const localData = data as Local | null;
        setLocal(localData);
        setLoading(false);

        if (localData) {
          supabase
            .from("ad_templates")
            .select("heading, subtitle, button_text, overlay_style, layout_model, custom_html")
            .eq("target_category", localData.categoria)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle()
            .then(({ data: tpl }) => {
              setAdTemplate(tpl as AdTemplate | null);
            });
        }
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!local) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Local não encontrado</h1>
        <Link to="/" className="text-primary hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  const galleryImages = local.imagens?.filter(Boolean) || [];
  const CatIcon = CATEGORIA_ICONS[local.categoria] || Building2;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Build banner heading with {nome} interpolation
  const bannerHeading = adTemplate
    ? adTemplate.heading.replace(/\{nome\}/gi, local.nome)
    : `Confira as melhores casas disponíveis à venda no ${local.nome}`;
  const bannerSubtitle = adTemplate?.subtitle?.replace(/\{nome\}/gi, local.nome) || '';
  const bannerButtonText = adTemplate?.button_text || 'VER IMÓVEIS DISPONÍVEIS';
  const overlayClass = OVERLAY_STYLES[adTemplate?.overlay_style || 'oceanic'] || OVERLAY_STYLES.oceanic;

  /* ── Mosaic gallery logic ── */
  const MOSAIC_MAX = 5;
  const mosaicImages = galleryImages.slice(0, MOSAIC_MAX);
  const extraPhotos = galleryImages.length - MOSAIC_MAX;

  return (
    <>
      <Helmet>
        <title>{local.nome} — Barra do Jacuípe</title>
        <meta name="description" content={local.descricao?.replace(/<[^>]+>/g, '').slice(0, 160) || `${local.nome} em Barra do Jacuípe`} />
      </Helmet>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative h-[340px] md:h-[460px] flex items-end overflow-hidden">
        {local.imagem_destaque ? (
          <picture>
            {local.imagem_destaque_mobile && (
              <source media="(max-width: 800px)" srcSet={local.imagem_destaque_mobile} />
            )}
            <img
              src={local.imagem_destaque}
              alt={local.nome}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          </picture>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />

        <div className="relative container pb-10 md:pb-14 z-10">
          <Breadcrumb>
            <BreadcrumbList className="text-primary-foreground/70">
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-primary-foreground/70 hover:text-primary-foreground">
                  <Link to="/">Início</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-primary-foreground/50" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild className="text-primary-foreground/70 hover:text-primary-foreground">
                  <Link to="/locais">Guia Local</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-primary-foreground/50" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-primary-foreground">{local.nome}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-3 mt-4 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-primary/80 text-primary-foreground backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full border border-primary-foreground/10">
              <CatIcon className="h-3.5 w-3.5" />
              {CATEGORIA_LABELS[local.categoria] || local.categoria}
            </span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground drop-shadow-lg leading-tight">
            {local.nome}
          </h1>
          {local.endereco && (
            <p className="text-primary-foreground/80 text-sm md:text-base mt-2 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" /> {local.endereco}
            </p>
          )}
        </div>
      </section>

      {/* ══════════════════ MAIN CONTENT ══════════════════ */}
      <section className="py-4 md:py-5">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">

            {/* ── Left Column ── */}
            <div className="min-w-0 space-y-14">

              {/* Description */}
              {local.descricao && (
                <div>
                  <SafeHtmlContent
                    html={local.descricao}
                    className="
                      prose-description
                      text-left
                      prose-headings:font-display prose-headings:text-foreground prose-headings:tracking-tight
                      prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4
                      prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                      prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:mb-5
                      prose-strong:text-foreground
                      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                      prose-li:text-muted-foreground prose-li:leading-[1.7]
                      prose-ul:my-4 prose-ol:my-4
                    "
                  />
                </div>
              )}

              {/* ── Mosaic Photo Gallery ── */}
              {galleryImages.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                    Fotos de {local.nome}
                  </h2>

                  {/* Desktop mosaic */}
                  <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 h-[420px]">
                    {/* Main large image */}
                    <div
                      className="col-span-2 row-span-2 rounded-xl overflow-hidden cursor-pointer group"
                      onClick={() => openLightbox(0)}
                    >
                      <img
                        src={galleryImages[0]}
                        alt={`${local.nome} - foto 1`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>

                    {mosaicImages.slice(1, 5).map((img, i) => (
                      <div
                        key={i}
                        className="relative rounded-xl overflow-hidden cursor-pointer group"
                        onClick={() => openLightbox(i + 1)}
                      >
                        <img
                          src={img}
                          alt={`${local.nome} - foto ${i + 2}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {i === mosaicImages.length - 2 && extraPhotos > 0 && (
                          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm backdrop-blur-[2px]">
                            <Camera className="h-5 w-5" />
                            +{extraPhotos} fotos
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Mobile gallery grid */}
                  <div className="grid grid-cols-2 gap-2.5 md:hidden">
                    {galleryImages.slice(0, 4).map((img, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                        onClick={() => openLightbox(i)}
                      >
                        <img
                          src={img}
                          alt={`${local.nome} - foto ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {i === 3 && galleryImages.length > 4 && (
                          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm">
                            <Camera className="h-4 w-4" />
                            +{galleryImages.length - 4} fotos
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Map (full width in content area) ── */}
              {local.latitude && local.longitude && (
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                    Localização
                  </h2>
                  <div className="rounded-xl overflow-hidden border border-border shadow-card">
                    <SmartMap
                      latitude={local.latitude}
                      longitude={local.longitude}
                      title={local.nome}
                      zoom={15}
                      interactive={false}
                      className="w-full h-[360px] md:h-[420px]"
                    />
                  </div>
                  {local.endereco && (
                    <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      {local.endereco}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Right Sidebar ── */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">

                {/* Info Card */}
                {(local.logo_url || local.endereco || local.telefone || local.horario_funcionamento || local.website || local.whatsapp || local.google_maps_link) && (
                  <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-5 shadow-card">
                    {/* Logo */}
                    {local.logo_url && (
                      <div className="flex justify-center pb-2">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-105 shadow-md">
                          <img
                            src={local.logo_url}
                            alt={`Logo ${local.nome}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    <h3 className="font-display font-semibold text-foreground text-lg">Informações</h3>

                    <div className="space-y-4">
                      {local.endereco && (
                        <div className="flex items-start gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-muted-foreground pt-1">{local.endereco}</span>
                        </div>
                      )}
                      {local.telefone && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Phone className="h-4 w-4 text-primary" />
                          </div>
                          <a href={`tel:${local.telefone}`} className="text-muted-foreground hover:text-primary transition-colors">{local.telefone}</a>
                        </div>
                      )}
                      {local.horario_funcionamento && (
                        <div className="flex items-start gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-muted-foreground pt-1">{local.horario_funcionamento}</span>
                        </div>
                      )}
                      {local.website && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Globe className="h-4 w-4 text-primary" />
                          </div>
                          <a href={local.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                            {local.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Coupon Badge */}
                    {local.cupom_desconto && (
                      <CouponBadge code={local.cupom_desconto} value={local.valor_desconto} />
                    )}

                    {/* Action buttons */}
                    <div className="space-y-3 pt-2">
                      {local.whatsapp && (
                        <a
                          href={`https://wa.me/${local.whatsapp}?text=${encodeURIComponent(
                            local.cupom_desconto
                              ? `Olá! Vi seu anúncio no Guia Barra do Jacuípe e gostaria de mais informações sobre ${local.nome}. Tenho o cupom: ${local.cupom_desconto}.`
                              : `Olá! Vi seu anúncio no Guia Barra do Jacuípe e gostaria de mais informações: ${local.nome}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white rounded-xl font-semibold hover:bg-[#1da851] transition-colors text-sm shadow-sm"
                        >
                          WhatsApp
                        </a>
                      )}
                      {local.google_maps_link && (
                        <a
                          href={local.google_maps_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-secondary text-foreground rounded-xl font-semibold hover:bg-secondary/80 transition-colors text-sm"
                        >
                          <ExternalLink className="h-4 w-4" /> Ver no Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Sidebar mini gallery (desktop, 3+ photos) ── */}
                {galleryImages.length >= 3 && (
                  <div className="hidden lg:block bg-card rounded-2xl border border-border p-6 shadow-card">
                    <h4 className="font-display font-semibold text-foreground mb-4 text-sm">Galeria Rápida</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {galleryImages.slice(0, 6).map((img, i) => (
                        <button
                          key={i}
                          onClick={() => openLightbox(i)}
                          className="aspect-square rounded-lg overflow-hidden border border-border hover:shadow-md transition-all group"
                        >
                          <img
                            src={img}
                            alt={`${local.nome} - foto ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  to="/"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar ao Guia Local
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA BANNERS ══════════════════ */}
      {adTemplate && adTemplate.layout_model === 'html_custom' && (
        <div className="mt-4">
          <div
            dangerouslySetInnerHTML={{
              __html: (adTemplate.custom_html || '').replace(/\{nome\}/gi, local.nome),
            }}
          />
        </div>
      )}

      {adTemplate && adTemplate.layout_model === 'split' && (
        <section className="relative overflow-hidden">
          <div className="grid md:grid-cols-2 min-h-[360px]">
            <div className={`flex flex-col justify-center px-8 py-14 md:px-16 bg-gradient-to-br ${overlayClass.replace('/90', '/95').replace('/80', '/90').replace('/70', '/85')} bg-[hsl(200,60%,12%)]`}>
              <p className="text-white/60 text-xs font-semibold tracking-[0.3em] uppercase mb-4">
                Oportunidade exclusiva
              </p>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
                {bannerHeading.includes(local.nome) ? (
                  <>
                    {bannerHeading.split(local.nome)[0]}
                    <span className="text-[hsl(39,80%,65%)]">{local.nome}</span>
                    {bannerHeading.split(local.nome).slice(1).join(local.nome)}
                  </>
                ) : bannerHeading}
              </h2>
              {bannerSubtitle && (
                <p className="text-white/70 text-sm md:text-base mb-6">{bannerSubtitle}</p>
              )}
              <Link
                to={local.url_vendas || `/imoveis?condominio=${local.slug}`}
                className="inline-flex items-center gap-2 px-8 py-4 font-bold text-sm tracking-widest uppercase self-start
                  bg-gradient-to-r from-[hsl(39,70%,55%)] to-[hsl(39,80%,65%)] text-[hsl(200,60%,10%)]
                  shadow-[0_0_20px_hsl(39,70%,55%,0.3)] hover:shadow-[0_0_35px_hsl(39,70%,55%,0.5)]
                  transition-all duration-300 hover:scale-105"
              >
                {bannerButtonText}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative min-h-[240px] md:min-h-0">
              <img
                src={local.banner_publicidade || local.imagem_destaque || ctaBgImage}
                alt="Banner publicitário"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      )}

      {adTemplate && (!adTemplate.layout_model || adTemplate.layout_model === 'full_banner') && (
        <section className="relative overflow-hidden group">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={local.banner_publicidade || ctaBgImage}
              alt="Banner publicitário"
              className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-110"
              loading="lazy"
              width={1920}
              height={640}
            />
            <div className={`absolute inset-0 bg-gradient-to-r ${overlayClass}`} />
          </div>

          <div className="relative z-10 px-8 py-20 md:py-24 md:px-16 flex flex-col items-center text-center gap-6">
            <p className="text-white/60 text-xs md:text-sm font-semibold tracking-[0.3em] uppercase">
              Oportunidade exclusiva
            </p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight max-w-3xl">
              {bannerHeading.includes(local.nome) ? (
                <>
                  {bannerHeading.split(local.nome)[0]}
                  <span className="text-[hsl(39,80%,65%)]">{local.nome}</span>
                  {bannerHeading.split(local.nome).slice(1).join(local.nome)}
                </>
              ) : bannerHeading}
            </h2>
            {bannerSubtitle && (
              <p className="text-white/70 text-sm md:text-base max-w-xl">{bannerSubtitle}</p>
            )}
            <Link
              to={local.url_vendas || `/imoveis?condominio=${local.slug}`}
              className="mt-2 inline-flex items-center gap-2 px-8 py-4 font-bold text-sm md:text-base tracking-widest uppercase
                bg-gradient-to-r from-[hsl(39,70%,55%)] to-[hsl(39,80%,65%)] text-[hsl(200,60%,10%)]
                shadow-[0_0_20px_hsl(39,70%,55%,0.3)] hover:shadow-[0_0_35px_hsl(39,70%,55%,0.5)]
                transition-all duration-300 hover:scale-105"
            >
              {bannerButtonText}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <Lightbox images={galleryImages} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
};

export default LocalDetalhe;
