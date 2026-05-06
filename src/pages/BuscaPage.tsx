import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Home, Grid3X3, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fuzzyMatch, parseSearchIntent } from '@/lib/utils';
import SmartSearch from '@/components/SmartSearch';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  type: 'categoria' | 'local' | 'imovel' | 'temporada';
  image?: string;
  icon?: string;
}

const TYPE_CONFIG = {
  categoria: { label: 'Categorias', Icon: Grid3X3, color: 'text-amber-500', bg: 'bg-amber-50' },
  local: { label: 'Locais', Icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  imovel: { label: 'Imóveis', Icon: Home, color: 'text-blue-500', bg: 'bg-blue-50' },
  temporada: { label: 'Temporada', Icon: Home, color: 'text-purple-500', bg: 'bg-purple-50' },
};

const BuscaPage = () => {
  const [params] = useSearchParams();
  const q = params.get('q') || '';

  // Cache static tables (categorias + locais) for 5 minutes; properties shorter
  const { data: catData } = useQuery({
    queryKey: ['busca-categorias'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from('guia_categorias').select('id, nome, slug, icone, descricao').limit(50);
      return data ?? [];
    },
  });
  const { data: localData } = useQuery({
    queryKey: ['busca-locais'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from('locais').select('id, nome, slug, categoria, imagem_destaque, endereco').eq('ativo', true).order('ordem').limit(200);
      return data ?? [];
    },
  });
  const { data: propData } = useQuery({
    queryKey: ['busca-properties'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, title, slug, location, thumbnail_url, image_url, transaction_type, price_formatted, condominio_slug').eq('status', 'active').limit(200);
      return data ?? [];
    },
  });

  const loading = !catData || !localData || !propData;

  const results = useMemo<SearchResult[]>(() => {
    if (!q.trim() || loading) return [];

    const intent = parseSearchIntent(q.trim());
    const searchTerm = intent.cleanQuery || q.trim();

    type Scored = SearchResult & { score: number };
    const items: Scored[] = [];
    const hasPropertyIntent = !!intent.transactionType;

    if (!hasPropertyIntent) {
      (catData ?? []).forEach((c: any) => {
        const { match, score } = fuzzyMatch(c.nome, searchTerm);
        if (match) items.push({ id: c.id, title: c.nome, subtitle: c.descricao, url: `/guia/categoria/${c.slug}`, type: 'categoria', icon: c.icone, score });
      });
    }

    (localData ?? []).forEach((l: any) => {
      const { match, score } = fuzzyMatch(l.nome, searchTerm);
      if (match) items.push({ id: l.id, title: l.nome, subtitle: l.endereco || l.categoria, url: `/locais/${l.slug}`, type: 'local', image: l.imagem_destaque, score: hasPropertyIntent ? score - 50 : score });
    });

    (propData ?? []).forEach((p: any) => {
      const titleMatch = fuzzyMatch(p.title || '', searchTerm);
      const locationMatch = fuzzyMatch(p.location || '', searchTerm);
      const condoMatch = fuzzyMatch((p.condominio_slug || '').replace(/-/g, ' '), searchTerm);
      const bestScore = Math.max(titleMatch.score, locationMatch.score, condoMatch.score);
      const matched = titleMatch.match || locationMatch.match || condoMatch.match;
      const isTemporada = p.transaction_type === 'temporada';

      if (intent.transactionType) {
        if (intent.transactionType === 'temporada' && !isTemporada) return;
        if (intent.transactionType === 'venda' && isTemporada) return;
      }

      if (matched) items.push({ id: p.id, title: p.title || 'Imóvel', subtitle: [p.location, p.price_formatted].filter(Boolean).join(' • '), url: `/imoveis/${isTemporada ? 'temporada' : 'venda'}/${p.slug || p.id}`, type: isTemporada ? 'temporada' : 'imovel', image: p.thumbnail_url || p.image_url, score: bestScore + (hasPropertyIntent ? 10 : 0) });
    });

    items.sort((a, b) => b.score - a.score);
    return items.map(({ score, ...rest }) => rest);
  }, [q, catData, localData, propData, loading]);

  const currentIntent = useMemo(() => parseSearchIntent(q), [q]);

  const groupOrder = currentIntent.transactionType
    ? (['imovel', 'temporada', 'local', 'categoria'] as const)
    : (['categoria', 'local', 'imovel', 'temporada'] as const);

  const grouped = groupOrder
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <Helmet><title>{q ? `Busca: ${q}` : 'Busca'} | Barra do Jacuípe</title></Helmet>

      <div className="pt-24 md:pt-28 pb-16">
        <div className="container max-w-4xl">
          {/* Search bar at top */}
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {q ? <>Resultados para "<span className="text-primary">{q}</span>"</> : 'Busca'}
            </h1>
            <SmartSearch variant="hero" placeholder="Buscar locais, imóveis, categorias..." />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {q ? 'Nenhum resultado encontrado' : 'Digite algo para buscar'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {q ? `Não encontramos resultados para "${q}". Tente outros termos.` : 'Pesquise por locais, imóveis ou categorias.'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {currentIntent.transactionType && results.length > 0 && (
                <div className="px-4 py-3 bg-primary/10 rounded-xl border border-primary/20">
                  <span className="text-sm font-medium text-primary">
                    Exibindo Imóveis para {currentIntent.intentLabel}
                    {currentIntent.cleanQuery ? ` em "${currentIntent.cleanQuery}"` : ''}
                  </span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </p>

              {grouped.map((group) => {
                const config = TYPE_CONFIG[group.type];
                const Icon = config.Icon;
                return (
                  <div key={group.type}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <h2 className="font-semibold text-foreground">{config.label}</h2>
                      <span className="text-xs text-muted-foreground">({group.items.length})</span>
                    </div>
                    <div className="grid gap-3">
                      {group.items.map((item) => (
                        <Link
                          key={item.id}
                          to={item.url}
                          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all group"
                        >
                          {item.image ? (
                            <img src={item.image} alt="" className="h-16 w-16 rounded-xl object-cover shrink-0" />
                          ) : item.icon ? (
                            <span className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">{item.icon}</span>
                          ) : (
                            <div className={`h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0 ${config.color}`}>
                              <Icon className="h-7 w-7" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{item.title}</p>
                            {item.subtitle && <p className="text-sm text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BuscaPage;
