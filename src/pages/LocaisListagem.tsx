import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SafeImage from "@/components/SafeImage";

interface Local {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoria: string;
  imagem_destaque: string | null;
  endereco: string | null;
}

const CATEGORIA_LABELS: Record<string, string> = {
  condominio: "Condomínios",
  mercado: "Mercados",
  padaria: "Padarias",
  restaurante: "Restaurantes",
  hospedagem: "Hospedagem",
  saude: "Saúde",
  gas: "Gás",
  limpeza: "Materiais de Limpeza",
  farmacia: "Farmácias",
  utilidade: "Utilidades",
  gastronomia: "Gastronomia",
};

const CATEGORIA_MAPPING: Record<string, string[]> = {
  gastronomia: ["restaurante", "padaria"],
  hospedagem: ["hospedagem"],
  utilidades: ["utilidade", "gas", "limpeza", "farmacia", "saude", "mercado"],
  condominios: ["condominio"],
};

const LocaisListagem = () => {
  const location = useLocation();
  const categoria = location.pathname.split("/").pop() || "";
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);

  const title = categoria ? (CATEGORIA_LABELS[categoria] || categoria.charAt(0).toUpperCase() + categoria.slice(1)) : "Locais";
  const dbCategorias = categoria ? (CATEGORIA_MAPPING[categoria] || [categoria]) : [];

  useEffect(() => {
    const fetch = async () => {
      let query = supabase.from("locais").select("id,nome,slug,descricao,categoria,imagem_destaque,endereco").eq("ativo", true).order("ordem").order("nome");
      if (dbCategorias.length === 1) {
        query = query.eq("categoria", dbCategorias[0]);
      } else if (dbCategorias.length > 1) {
        query = query.in("categoria", dbCategorias);
      }
      const { data } = await query;
      setLocais((data as Local[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [categoria]);

  return (
    <>
      <Helmet>
        <title>{title} — Barra do Jacuípe</title>
        <meta name="description" content={`Encontre ${title.toLowerCase()} em Barra do Jacuípe, Litoral Norte da Bahia.`} />
      </Helmet>

      <div className="pt-24 pb-16">
        <div className="container">
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">Encontre os melhores estabelecimentos em Barra do Jacuípe</p>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : locais.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-xl"><p className="text-muted-foreground">Nenhum local encontrado nesta categoria.</p></div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {locais.map((local) => (
                <Link key={local.id} to={`/locais/${local.slug}`} className="group">
                  <div className="overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-[var(--shadow-card-hover)] transition-all">
                    <div className="aspect-[16/10] overflow-hidden">
                      <SafeImage
                        src={local.imagem_destaque || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"}
                        alt={local.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <Badge variant="secondary" className="mb-2 text-xs">{CATEGORIA_LABELS[local.categoria] || local.categoria}</Badge>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{local.nome}</h3>
                      {local.endereco && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">{local.endereco}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LocaisListagem;
