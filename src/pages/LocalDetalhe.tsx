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

const LocalDetalhe = () => {
  const { slug } = useParams<{ slug: string }>();
  const [local, setLocal] = useState<Local | null>(null);
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
        setLocal(data as Local | null);
        setLoading(false);
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
              {/* Gallery */}
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

              {/* Rich text description */}
              {local.descricao && (
                <div>
                  <div
                    className="prose prose-lg max-w-none prose-slate prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
                    style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    dangerouslySetInnerHTML={{ __html: local.descricao }}
                  />
                </div>
              )}

              {/* Map on public page */}
              {local.latitude && local.longitude && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">Localização</h2>
                  <SmartMap
                    latitude={local.latitude}
                    longitude={local.longitude}
                    title={local.nome}
                    zoom={15}
                    interactive={false}
                    className="w-full h-[300px] rounded-xl border border-border"
                  />
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-6 space-y-4 sticky top-24">
                <h3 className="font-semibold text-foreground">Informações</h3>

                {local.endereco && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{local.endereco}</span>
                  </div>
                )}
                {local.telefone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <a href={`tel:${local.telefone}`} className="text-muted-foreground hover:text-primary transition-colors">{local.telefone}</a>
                  </div>
                )}
                {local.horario_funcionamento && (
                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{local.horario_funcionamento}</span>
                  </div>
                )}
                {local.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-primary shrink-0" />
                    <a href={local.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {local.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}

                {local.whatsapp && (
                  <a
                    href={`https://wa.me/${local.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#1da851] transition-colors text-sm"
                  >
                    WhatsApp
                  </a>
                )}
                {local.google_maps_link && (
                  <a
                    href={local.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors text-sm"
                  >
                    <ExternalLink className="h-4 w-4" /> Ver no Google Maps
                  </a>
                )}
              </div>

              <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar ao Guia
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        images={extraImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

export default LocalDetalhe;
