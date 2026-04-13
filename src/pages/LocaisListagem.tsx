import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SafeImage from "@/components/SafeImage";
import PropertyCard, { type PropertyData } from "@/components/PropertyCard";

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

const HOSPEDAGEM_SLUGS = ["hospedagem", "pousadas", "hoteis", "hotel", "pousada"];

const TEMPORADA_COLS = "id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate";

const LocaisListagem = () => {
  const location = useLocation();
  const categoria = location.pathname.split("/").pop() || "";
  const [locais, setLocais] = useState<Local[]>([]);
  const [temporadaProperties, setTemporadaProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);

  const title = categoria ? (CATEGORIA_LABELS[categoria] || categoria.charAt(0).toUpperCase() + categoria.slice(1)) : "Locais";
  const dbCategorias = categoria ? (CATEGORIA_MAPPING[categoria] || [categoria]) : [];
  const isHospedagem = HOSPEDAGEM_SLUGS.includes(categoria.toLowerCase());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      let query = supabase.from("locais").select("id,nome,slug,descricao,categoria,imagem_destaque,endereco").eq("ativo", true).order("ordem").order("nome");
      if (dbCategorias.length === 1) {
        query = query.eq("categoria", dbCategorias[0]);
      } else if (dbCategorias.length > 1) {
        query = query.in("categoria", dbCategorias);
      }

      const locaisPromise = query.then(r => r);

      if (isHospedagem) {
        const propPromise = supabase
          .from("properties")
          .select(TEMPORADA_COLS)
          .eq("status", "active")
          .in("transaction_type", ["temporada", "ambos"])
          .order("created_at", { ascending: false })
          .limit(12)
          .then(r => r);

        const [locaisRes, propRes] = await Promise.all([locaisPromise, propPromise]);
        setLocais((locaisRes.data as Local[]) ?? []);
        setTemporadaProperties((propRes.data as PropertyData[]) ?? []);
      } else {
        const locaisRes = await locaisPromise;
        setLocais((locaisRes.data as Local[]) ?? []);
        setTemporadaProperties([]);
      }
      setLoading(false);
    };
    fetchData();
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
          ) : locais.length === 0 && temporadaProperties.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-xl"><p className="text-muted-foreground">Nenhum local encontrado nesta categoria.</p></div>
          ) : (
            <>
              {locais.length > 0 && (
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

              {isHospedagem && temporadaProperties.length > 0 && (
                <section className="mt-14">
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      🏖️ Casas e Imóveis para Temporada
                    </h2>
                    <p className="text-muted-foreground">
                      Confira também opções de aluguel por temporada em Barra do Jacuípe
                    </p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {temporadaProperties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <Link
                      to="/imoveis/temporada"
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      Ver Todos os Imóveis para Temporada
                    </Link>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LocaisListagem;
