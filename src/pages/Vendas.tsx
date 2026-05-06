import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { SlidersHorizontal, X, Search } from "lucide-react";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import PropertyCard, { type PropertyData } from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import GlobalBlocks from "@/components/GlobalBlocks";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

const tiposImovel = ["Todos", "Casa", "Sítio", "Terreno"];

const formatCurrency = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("pt-BR");
};

const parseCurrency = (formatted: string): number => {
  const digits = formatted.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

const selectClass = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

const PriceInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(formatCurrency(e.target.value))}
      placeholder={placeholder}
      className={`${selectClass} pl-10`}
    />
  </div>
);
const quartosOptions = ["Qualquer", "1+", "2+", "3+", "4+", "5+"];

interface CondominioOption {
  slug: string;
  name: string;
}

const Vendas = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [condominiosOptions, setCondominiosOptions] = useState<CondominioOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [tipo, setTipo] = useState(() => {
    const param = searchParams.get("tipo");
    if (!param) return "Todos";
    const match = tiposImovel.find(t => t.toLowerCase() === param.toLowerCase());
    return match || "Todos";
  });
  const [precoMin, setPrecoMin] = useState(() => {
    const param = searchParams.get("minPrice");
    return param ? formatCurrency(param) : "";
  });
  const [precoMax, setPrecoMax] = useState(() => {
    const param = searchParams.get("maxPrice");
    return param ? formatCurrency(param) : "";
  });
  const [quartos, setQuartos] = useState("Qualquer");
  const [condominio, setCondominio] = useState("Todos");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const [propertiesRes, condominiosRes] = await Promise.all([
        supabase.from("properties").select("id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate").eq("status", "active").in("transaction_type", ["venda", "ambos"]).order("created_at", { ascending: false }),
        supabase.from("condominios").select("slug, name").order("name"),
      ]);
      if (cancelled) return;
      if (propertiesRes.data) setProperties(propertiesRes.data as PropertyData[]);
      if (condominiosRes.data) setCondominiosOptions(condominiosRes.data);
      setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const minVal = parseCurrency(precoMin);
    const maxVal = parseCurrency(precoMax);
    return properties.filter((p) => {
      if (tipo !== "Todos" && p.property_type.toLowerCase() !== tipo.toLowerCase()) return false;
      if (minVal > 0 && p.price < minVal) return false;
      if (maxVal > 0 && p.price > maxVal) return false;
      if (quartos !== "Qualquer") {
        const min = parseInt(quartos);
        if (p.bedrooms < min) return false;
      }
      if (condominio !== "Todos" && p.condominio_slug !== condominio) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        const inTags = p.tags?.some(t => t.toLowerCase().includes(kw));
        const inTitle = p.title.toLowerCase().includes(kw);
        if (!inTags && !inTitle) return false;
      }
      return true;
    });
  }, [properties, tipo, precoMin, precoMax, quartos, condominio, keyword]);

  const { visibleItems, sentinelRef, hasMore, currentPage, totalPages } = useInfiniteScroll(filtered);

  return (
    <>
      <Helmet>
        <title>Comprar Casa em Barra do Jacuípe Bahia - Imóveis à Venda</title>
        <meta name="description" content="Casas e terrenos à venda em Barra do Jacuípe, Bahia. Encontre imóveis de alto padrão, sítios e casas em condomínios fechados no Litoral Norte baiano." />
        {currentPage < totalPages && (
          <link rel="next" href={`${location.pathname}?page=${currentPage + 1}`} />
        )}
        {currentPage > 1 && (
          <link rel="prev" href={`${location.pathname}?page=${currentPage - 1}`} />
        )}
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
            <SlidersHorizontal className="h-4 w-4" /> Filtros
          </button>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-card rounded-xl border border-border p-5 shadow-card">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Filtrar Imóveis</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Palavra-chave ou Comodidade</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Ex: Piscina, Jardim..."
                        className={`${selectClass} pl-9`}
                      />
                    </div>
                  </div>
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
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Palavra-chave ou Comodidade</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          placeholder="Ex: Piscina, Jardim..."
                          className={`${selectClass} pl-9`}
                        />
                      </div>
                    </div>
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
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-muted/30 rounded-xl border border-border">
                  <p className="text-muted-foreground text-lg">
                    {properties.length === 0
                      ? "Nenhuma oportunidade disponível no momento. Volte em breve!"
                      : "Nenhum imóvel encontrado com os filtros selecionados."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {visibleItems.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                  {hasMore && (
                    <div ref={sentinelRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <PropertyCardSkeleton key={`skel-${i}`} />
                      ))}
                    </div>
                  )}
                  {/* SEO: crawlable pagination links */}
                  <nav className="sr-only" aria-label="Paginação">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <a key={i} href={`${location.pathname}?page=${i + 1}`}>
                        Página {i + 1}
                      </a>
                    ))}
                  </nav>
                </>
              )}
            </div>
          </div>
        </div>

        <GlobalBlocks pageSlug="vendas" />
      </div>
    </>
  );
};

export default Vendas;
