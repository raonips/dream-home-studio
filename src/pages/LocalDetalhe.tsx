import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Phone, Clock, Globe, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

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
  endereco: string | null;
  horario_funcionamento: string | null;
  website: string | null;
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
        <h1 className="text-2xl font-bold">Local não encontrado</h1>
        <Link to="/" className="text-primary hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{local.nome} — Barra do Jacuípe</title>
        <meta name="description" content={local.descricao?.slice(0, 160) || `${local.nome} em Barra do Jacuípe`} />
      </Helmet>

      <div className="pt-20 pb-16">
        {/* Hero */}
        {local.imagem_destaque && (
          <div className="relative h-[300px] md:h-[400px] overflow-hidden">
            <img src={local.imagem_destaque} alt={local.nome} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-0 right-0 container">
              <Badge className="bg-white/20 text-white backdrop-blur-sm mb-2">
                {CATEGORIA_LABELS[local.categoria] || local.categoria}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{local.nome}</h1>
            </div>
          </div>
        )}

        <div className="container mt-8">
          {!local.imagem_destaque && (
            <>
              <Badge variant="secondary" className="mb-3">
                {CATEGORIA_LABELS[local.categoria] || local.categoria}
              </Badge>
              <h1 className="text-3xl font-bold text-foreground mb-6">{local.nome}</h1>
            </>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2">
              {local.descricao && (
                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: local.descricao }} />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
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
                    <a href={`tel:${local.telefone}`} className="text-muted-foreground hover:text-primary">{local.telefone}</a>
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
                    <a href={local.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{local.website.replace(/^https?:\/\//, "")}</a>
                  </div>
                )}
                {local.whatsapp && (
                  <a
                    href={`https://wa.me/${local.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
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
    </>
  );
};

export default LocalDetalhe;
