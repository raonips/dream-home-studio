import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Loader2 } from "lucide-react";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import PropertyCard, { type PropertyData } from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import GlobalBlocks from "@/components/GlobalBlocks";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

const LISTING_COLS = "id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate";

const tiposImovel = ["Todos", "Casa", "Sítio", "Terreno"];
const quartosOptions = ["Qualquer", "1+", "2+", "3+", "4+", "5+"];

interface CondominioOption {
  slug: string;
  name: string;
}

const selectClass = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

const formatCurrency = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  return num.toLocaleString("pt-BR");
};

const parseCurrency = (formatted: string): number => {
  const digits = formatted.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

const PriceInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatCurrency(e.target.value));
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${selectClass} pl-10`}
      />
    </div>
  );
};

const FilterControls = ({
  tipo, setTipo, quartos, setQuartos, condominio, setCondominio,
  precoMin, setPrecoMin, precoMax, setPrecoMax, condominiosOptions,
}: {
  tipo: string; setTipo: (v: string) => void;
  quartos: string; setQuartos: (v: string) => void;
  condominio: string; setCondominio: (v: string) => void;
  precoMin: string; setPrecoMin: (v: string) => void;
  precoMax: string; setPrecoMax: (v: string) => void;
  condominiosOptions: CondominioOption[];
}) => (
  <div className="space-y-5">
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tipo de Imóvel</label>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtrar por tipo de imóvel" className={selectClass}>
        {tiposImovel.map((t) => <option key={t}>{t}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Preço Mínimo</label>
      <PriceInput value={precoMin} onChange={setPrecoMin} placeholder="0" />
    </div>
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Preço Máximo</label>
      <PriceInput value={precoMax} onChange={setPrecoMax} placeholder="Sem limite" />
    </div>
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Quartos</label>
      <select value={quartos} onChange={(e) => setQuartos(e.target.value)} aria-label="Filtrar por quartos" className={selectClass}>
        {quartosOptions.map((q) => <option key={q}>{q}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Condomínio</label>
      <select value={condominio} onChange={(e) => setCondominio(e.target.value)} aria-label="Filtrar por condomínio" className={selectClass}>
        <option value="Todos">Todos</option>
        {condominiosOptions.map((c) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>
    </div>
  </div>
);

const ITEMS_PER_PAGE = 12;

const Imoveis = () => {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [condominiosOptions, setCondominiosOptions] = useState<CondominioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const qTipo = searchParams.get("tipo") || "Todos";
  const qLocalizacao = searchParams.get("localizacao") || "Todos";

  const [tipo, setTipo] = useState(qTipo);
  const [quartos, setQuartos] = useState("Qualquer");
  const [condominio, setCondominio] = useState(qLocalizacao);
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setTipo(qTipo);
    setCondominio(qLocalizacao);
  }, [qTipo, qLocalizacao]);

  const buildQuery = useCallback(() => {
    let query = supabase
      .from("properties")
      .select(LISTING_COLS, { count: "exact" })
      .eq("status", "active")
      .in("transaction_type", ["venda", "ambos"]);

    if (tipo !== "Todos") {
      query = query.ilike("property_type", tipo);
    }
    const minVal = parseCurrency(precoMin);
    const maxVal = parseCurrency(precoMax);
    if (minVal > 0) query = query.gte("price", minVal);
    if (maxVal > 0) query = query.lte("price", maxVal);
    if (quartos !== "Qualquer") {
      query = query.gte("bedrooms", parseInt(quartos));
    }
    if (condominio !== "Todos") {
      query = query.eq("condominio_slug", condominio);
    }

    return query.order("created_at", { ascending: false });
  }, [tipo, precoMin, precoMax, quartos, condominio]);

  // Fetch condominios options once
  useEffect(() => {
    supabase.from("condominios").select("slug, name").order("name")
      .then(({ data }) => { if (data) setCondominiosOptions(data); });
  }, []);

  // Fetch properties when filters change (reset to page 0)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(0);

    buildQuery()
      .range(0, ITEMS_PER_PAGE - 1)
      .then(({ data, count }) => {
        if (cancelled) return;
        if (data) setProperties(data as PropertyData[]);
        if (count !== null) setTotalCount(count);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [buildQuery]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    const from = nextPage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data } = await buildQuery().range(from, to);
    if (data) {
      setProperties((prev) => [...prev, ...data as PropertyData[]]);
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  const hasMore = properties.length < totalCount;

  const filterProps = { tipo, setTipo, quartos, setQuartos, condominio, setCondominio, precoMin, setPrecoMin, precoMax, setPrecoMax, condominiosOptions };

  return (
    <>
      <Helmet>
        <title>Comprar Casa em Barra do Jacuípe Bahia - Imóveis à Venda</title>
        <meta name="description" content="Casas e terrenos à venda em Barra do Jacuípe, Bahia. Encontre imóveis de alto padrão, sítios e casas em condomínios fechados no Litoral Norte baiano." />
      </Helmet>

      <div className="pt-20 md:pt-24 pb-16 md:pb-24 bg-background min-h-screen">
        <div className="container">
          <div className="mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild><Link to="/">Início</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Imóveis à Venda</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="mb-10 md:mb-14">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Casas e Terrenos à Venda em Barra do Jacuípe
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              Explore nosso catálogo completo de imóveis no Litoral Norte da Bahia. Use os filtros para encontrar o imóvel ideal.
            </p>
          </div>

          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden flex items-center gap-2 mb-6 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-card rounded-xl border border-border p-5 shadow-card">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Filtrar Imóveis</h3>
                <FilterControls {...filterProps} />
              </div>
            </aside>

            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 bg-foreground/50 lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
                <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-background p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg font-semibold text-foreground">Filtrar Imóveis</h3>
                    <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <FilterControls {...filterProps} />
                </div>
              </div>
            )}

            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                  <p className="text-muted-foreground text-lg">
                    Nenhum imóvel encontrado com os filtros selecionados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="text-center mt-8">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-60 inline-flex items-center gap-2"
                      >
                        {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                        Carregar Mais ({totalCount - properties.length} restantes)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <GlobalBlocks pageSlug="imoveis_list" />
      </div>
    </>
  );
};

export default Imoveis;
