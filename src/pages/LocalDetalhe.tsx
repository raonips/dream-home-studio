import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Clock, Globe, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import SmartMap from "@/components/SmartMap";
import Lightbox from "@/components/Lightbox";
import ctaBgImage from "@/assets/cta-condominio-bg.jpg";

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
  imagens: string[] | null;
  endereco: string | null;
  horario_funcionamento: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  url_vendas: string | null;
  banner_publicidade: string | null;
}

interface AdTemplate {
  heading: string;
  subtitle: string;
  button_text: string;
  overlay_style: string;
  layout_model: string;
  custom_html: string;
}

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

const OVERLAY_STYLES: Record<string, string> = {
  oceanic: "from-[hsl(200,60%,12%)]/90 via-[hsl(200,50%,18%)]/80 to-[hsl(200,40%,25%)]/70",
  dark: "from-black/90 via-black/75 to-black/60",
  warm: "from-[hsl(30,40%,15%)]/90 via-[hsl(30,30%,20%)]/80 to-[hsl(30,25%,25%)]/70",
};

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

        // Fetch matching ad template for this category
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
      <div className="min-h-[60vh] flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!local) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center pt-20 gap-4">
        <h1 className="text-2xl font-bold text-foreground">Local não encontrado</h1>
        <Link to="/" className="text-primary hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  const galleryImages = local.imagens?.filter(Boolean) || [];
  const extraImages = galleryImages.filter(img => img !== local.imagem_destaque);

  // Build banner heading with {nome} interpolation
  const bannerHeading = adTemplate
    ? adTemplate.heading.replace(/\{nome\}/gi, local.nome)
    : `Confira as melhores casas disponíveis à venda no ${local.nome}`;
  const bannerSubtitle = adTemplate?.subtitle?.replace(/\{nome\}/gi, local.nome) || '';
  const bannerButtonText = adTemplate?.button_text || 'VER IMÓVEIS DISPONÍVEIS';
  const overlayClass = OVERLAY_STYLES[adTemplate?.overlay_style || 'oceanic'] || OVERLAY_STYLES.oceanic;

  return (
    <>
      <Helmet>
        <title>{local.nome} — Barra do Jacuípe</title>
        <meta name="description" content={local.descricao?.replace(/<[^>]+>/g, '').slice(0, 160) || `${local.nome} em Barra do Jacuípe`} />
      </Helmet>

      <div className="pt-20 pb-16">
        {/* ── Hero / Capa ── */}
        {local.imagem_destaque && (
          <div className="relative h-[300px] md:h-[420px] overflow-hidden">
            <img src={local.imagem_destaque} alt={local.nome} className="w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-0 right-0 container">
              <Badge className="bg-primary/80 text-primary-foreground backdrop-blur-sm mb-2 border-0">
                {CATEGORIA_LABELS[local.categoria] || local.categoria}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{local.nome}</h1>
              {local.endereco && (
                <p className="text-white/80 text-sm mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {local.endereco}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="container mt-8">
          {!local.imagem_destaque && (
            <div className="mb-6">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">
                {CATEGORIA_LABELS[local.categoria] || local.categoria}
              </Badge>
              <h1 className="text-3xl font-bold text-foreground">{local.nome}</h1>
              {local.endereco && (
                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {local.endereco}
                </p>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-[1fr_320px] gap-8 overflow-hidden">
            {/* ── Main Content ── */}
            <div className="min-w-0 space-y-8">
              {extraImages.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Fotos</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {extraImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                        className="aspect-[4/3] rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
                      >
                        <img src={img} alt={`${local.nome} foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {local.descricao && (
                <div>
                  <div
                    className="prose prose-lg max-w-none prose-slate prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
                    style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    dangerouslySetInnerHTML={{ __html: local.descricao }}
                  />
                </div>
              )}

              {local.latitude && local.longitude && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Localização</h2>
                  <SmartMap latitude={local.latitude} longitude={local.longitude} title={local.nome} zoom={15} interactive={false} className="w-full h-[300px] rounded-xl border border-border" />
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-6 space-y-4 sticky top-24">
                <h3 className="font-semibold text-foreground">Informações</h3>
                {local.endereco && (
                  <div className="flex items-start gap-3 text-sm"><MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span className="text-muted-foreground">{local.endereco}</span></div>
                )}
                {local.telefone && (
                  <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-primary shrink-0" /><a href={`tel:${local.telefone}`} className="text-muted-foreground hover:text-primary transition-colors">{local.telefone}</a></div>
                )}
                {local.horario_funcionamento && (
                  <div className="flex items-start gap-3 text-sm"><Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" /><span className="text-muted-foreground">{local.horario_funcionamento}</span></div>
                )}
                {local.website && (
                  <div className="flex items-center gap-3 text-sm"><Globe className="h-4 w-4 text-primary shrink-0" /><a href={local.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{local.website.replace(/^https?:\/\//, "")}</a></div>
                )}
                {local.whatsapp && (
                  <a href={`https://wa.me/${local.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#1da851] transition-colors text-sm">WhatsApp</a>
                )}
                {local.google_maps_link && (
                  <a href={local.google_maps_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors text-sm"><ExternalLink className="h-4 w-4" /> Ver no Google Maps</a>
                )}
              </div>
              <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><ArrowLeft className="h-4 w-4" /> Voltar ao Guia</Link>
            </div>
          </div>
        </div>

        {/* ── CTA Banner — shows when there's an active template for this category ── */}
        {adTemplate && adTemplate.layout_model === 'html_custom' && (
          <div className="mt-16">
            <div
              dangerouslySetInnerHTML={{
                __html: (adTemplate.custom_html || '').replace(/\{nome\}/gi, local.nome),
              }}
            />
          </div>
        )}

        {adTemplate && adTemplate.layout_model === 'split' && (
          <div className="relative mt-16 overflow-hidden group">
            <div className="grid md:grid-cols-2 min-h-[360px]">
              {/* Text side */}
              <div className={`flex flex-col justify-center px-8 py-12 md:px-16 bg-gradient-to-br ${overlayClass.replace('/90', '/95').replace('/80', '/90').replace('/70', '/85')} bg-[hsl(200,60%,12%)]`}>
                <p className="text-white/60 text-xs font-semibold tracking-[0.3em] uppercase mb-4">
                  Oportunidade exclusiva
                </p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
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
              {/* Image side */}
              <div className="relative min-h-[240px] md:min-h-0">
                <img
                  src={local.banner_publicidade || local.imagem_destaque || ctaBgImage}
                  alt="Banner publicitário"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        )}

        {adTemplate && (!adTemplate.layout_model || adTemplate.layout_model === 'full_banner') && (
          <div className="relative mt-16 overflow-hidden group">
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

            <div className="relative z-10 px-8 py-16 md:py-20 md:px-16 flex flex-col items-center text-center gap-6">
              <p className="text-white/60 text-xs md:text-sm font-semibold tracking-[0.3em] uppercase">
                Oportunidade exclusiva
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight max-w-3xl">
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
          </div>
        )}
      </div>

      <Lightbox images={extraImages} initialIndex={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
};

export default LocalDetalhe;
