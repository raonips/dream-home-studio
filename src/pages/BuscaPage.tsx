import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Home, Grid3X3, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeText } from '@/lib/utils';
import SmartSearch from '@/components/SmartSearch';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  type: 'categoria' | 'local' | 'imovel';
  image?: string;
  icon?: string;
}

const TYPE_CONFIG = {
  categoria: { label: 'Categorias', Icon: Grid3X3, color: 'text-amber-500', bg: 'bg-amber-50' },
  local: { label: 'Locais', Icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  imovel: { label: 'Imóveis', Icon: Home, color: 'text-blue-500', bg: 'bg-blue-50' },
};

const BuscaPage = () => {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q.trim()) { setResults([]); setLoading(false); return; }

    let cancelled = false;
    const doSearch = async () => {
      setLoading(true);
      const normalizedQuery = normalizeText(q.trim());

      // Fetch broader results (accent-insensitive matching done client-side)
      const [catRes, localRes, propRes] = await Promise.all([
        supabase.from('guia_categorias').select('id, nome, slug, icone, descricao').limit(50),
        supabase.from('locais').select('id, nome, slug, categoria, imagem_destaque, endereco').eq('ativo', true).order('ordem').limit(100),
        supabase.from('properties').select('id, title, slug, location, thumbnail_url, image_url, transaction_type, price_formatted').eq('status', 'active').limit(100),
      ]);

      if (cancelled) return;

      const items: SearchResult[] = [];

      // Filter categories by normalized text match
      (catRes.data ?? [])
        .filter((c: any) => normalizeText(c.nome).includes(normalizedQuery))
        .slice(0, 10)
        .forEach((c: any) => items.push({ id: c.id, title: c.nome, subtitle: c.descricao, url: `/guia/categoria/${c.slug}`, type: 'categoria', icon: c.icone }));

      // Filter locais by normalized text match
      (localRes.data ?? [])
        .filter((l: any) => normalizeText(l.nome).includes(normalizedQuery))
        .slice(0, 20)
        .forEach((l: any) => items.push({ id: l.id, title: l.nome, subtitle: l.endereco || l.categoria, url: `/locais/${l.slug}`, type: 'local', image: l.imagem_destaque }));

      // Filter properties by normalized text match
      (propRes.data ?? [])
        .filter((p: any) => normalizeText(p.title || '').includes(normalizedQuery))
        .slice(0, 20)
        .forEach((p: any) => items.push({ id: p.id, title: p.title || 'Imóvel', subtitle: [p.location, p.price_formatted].filter(Boolean).join(' • '), url: `/imoveis/${p.transaction_type === 'temporada' ? 'temporada' : 'venda'}/${p.slug || p.id}`, type: 'imovel', image: p.thumbnail_url || p.image_url }));

      setResults(items);
      setLoading(false);
    };

    doSearch();
    return () => { cancelled = true; };
  }, [q]);

  const grouped = (['categoria', 'local', 'imovel'] as const)
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
