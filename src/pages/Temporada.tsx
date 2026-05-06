import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "react-router-dom";
import { SlidersHorizontal, X, CalendarDays, Search } from "lucide-react";
import PropertyCardSkeleton from "@/components/PropertyCardSkeleton";
import PropertyCard, { type PropertyData } from "@/components/PropertyCard";
import { supabase } from "@/integrations/supabase/client";
import GlobalBlocks from "@/components/GlobalBlocks";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface CondominioOption {
  slug: string;
  name: string;
}

const selectClass = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

const formatCurrency = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("pt-BR");
};

const parseCurrency = (formatted: string): number => {
  const digits = formatted.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

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

const GuestCounter = ({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (v: number) => void; min?: number }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-foreground">{label}</span>
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 rounded-full border border-input flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30" disabled={value <= min}>−</button>
      <span className="w-6 text-center text-sm font-medium">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="w-8 h-8 rounded-full border border-input flex items-center justify-center text-foreground hover:bg-muted">+</button>
    </div>
  </div>
);

const Temporada = () => {
  const location = useLocation();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [condominiosOptions, setCondominiosOptions] = useState<CondominioOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [condominio, setCondominio] = useState("Todos");
  const [checkin, setCheckin] = useState<Date | undefined>();
  const [checkout, setCheckout] = useState<Date | undefined>();
  const [adultos, setAdultos] = useState(2);
  const [criancas, setCriancas] = useState(0);
  const [pets, setPets] = useState(0);
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  const totalGuests = adultos + criancas;

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const [propertiesRes, condominiosRes] = await Promise.all([
        supabase.from("properties").select("id,title,slug,price,price_formatted,location,area,bedrooms,bathrooms,parking,tags,highlight_tag,image_url,thumbnail_url,partnership,property_type,condominio_slug,status,transaction_type,max_guests,daily_rate").eq("status", "active").in("transaction_type", ["temporada", "ambos"]).order("created_at", { ascending: false }),
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
      if (condominio !== "Todos" && p.condominio_slug !== condominio) return false;
      const maxGuests = (p as any).max_guests || 0;
      if (maxGuests > 0 && totalGuests > maxGuests) return false;
      if (minVal > 0 && (p as any).daily_rate < minVal) return false;
      if (maxVal > 0 && (p as any).daily_rate > maxVal) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        const inTags = p.tags?.some(t => t.toLowerCase().includes(kw));
        const inTitle = p.title.toLowerCase().includes(kw);
        if (!inTags && !inTitle) return false;
      }
      return true;
    });
  }, [properties, condominio, totalGuests, precoMin, precoMax, keyword]);

  const { visibleItems, sentinelRef, hasMore, currentPage, totalPages } = useInfiniteScroll(filtered);

  const filtersJsx = (
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
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Onde</label>
        <select value={condominio} onChange={(e) => setCondominio(e.target.value)} aria-label="Filtrar por localização" className={selectClass}>
          <option value="Todos">Qualquer localização</option>
          {condominiosOptions.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Check-in</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !checkin && "text-muted-foreground")}>
              <CalendarDays className="mr-2 h-4 w-4" />
              {checkin ? format(checkin, "dd/MM/yyyy") : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={checkin} onSelect={setCheckin} disabled={(date) => date < new Date()} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Check-out</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !checkout && "text-muted-foreground")}>
              <CalendarDays className="mr-2 h-4 w-4" />
              {checkout ? format(checkout, "dd/MM/yyyy") : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={checkout} onSelect={setCheckout} disabled={(date) => date < (checkin || new Date())} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Quem</label>
        <div className="border border-input rounded-lg p-3 space-y-1">
          <GuestCounter label="Adultos" value={adultos} onChange={setAdultos} min={1} />
          <GuestCounter label="Crianças" value={criancas} onChange={setCriancas} />
          <GuestCounter label="Pets" value={pets} onChange={setPets} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Diária Mínima</label>
        <PriceInput value={precoMin} onChange={setPrecoMin} placeholder="0" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Diária Máxima</label>
        <PriceInput value={precoMax} onChange={setPrecoMax} placeholder="Sem limite" />
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Aluguel por Temporada em Barra do Jacuípe BA - Casas para Férias</title>
        <meta name="description" content="Alugue casas por temporada em Barra do Jacuípe, Bahia. Casas em condomínios fechados com piscina, segurança e lazer completo para suas férias no Litoral Norte." />
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
                  <BreadcrumbPage>Temporada</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="mb-10 md:mb-14">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Casas para Temporada em Barra do Jacuípe
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              Reserve sua estadia no Litoral Norte da Bahia. Casas equipadas com conforto e segurança para suas férias.
            </p>
          </div>

          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden flex items-center gap-2 mb-6 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filtros
          </button>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 bg-card rounded-xl border border-border p-5 shadow-card">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Buscar Hospedagem</h3>
                {filtersJsx}
              </div>
            </aside>

            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 bg-foreground/50 lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
                <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-background p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-lg font-semibold text-foreground">Buscar Hospedagem</h3>
                    <button onClick={() => setMobileFiltersOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {filtersJsx}
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
                      ? "Nenhuma casa disponível para temporada no momento. Volte em breve!"
                      : "Nenhum imóvel encontrado com os filtros selecionados."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {visibleItems.map((property) => (
                      <PropertyCard key={property.id} property={property} variant="temporada" />
                    ))}
                  </div>
                  {hasMore && (
                    <div ref={sentinelRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <PropertyCardSkeleton key={`skel-${i}`} />
                      ))}
                    </div>
                  )}
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

        <GlobalBlocks pageSlug="temporada" />
      </div>
    </>
  );
};

export default Temporada;
