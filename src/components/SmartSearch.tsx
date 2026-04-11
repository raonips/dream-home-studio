import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Home, Grid3X3, Loader2 } from 'lucide-react';
import { cn, fuzzyMatch } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

/* ── Types ── */
interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  type: 'categoria' | 'local' | 'imovel';
  image?: string;
  icon?: string;
}

interface Props {
  /** Render as hero search bar (white bg, large) vs header icon */
  variant?: 'hero' | 'header';
  className?: string;
  placeholder?: string;
}

const TYPE_CONFIG = {
  categoria: { label: 'Categorias', Icon: Grid3X3, color: 'text-amber-500' },
  local: { label: 'Locais', Icon: MapPin, color: 'text-emerald-500' },
  imovel: { label: 'Imóveis', Icon: Home, color: 'text-blue-500' },
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const SmartSearch = ({ variant = 'hero', className, placeholder = 'O que você está procurando?' }: Props) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query.trim(), 300);

  // Search Supabase with accent-insensitive filtering
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const doSearch = async () => {
      setLoading(true);

      const [catRes, localRes, propRes] = await Promise.all([
        supabase.from('guia_categorias').select('id, nome, slug, icone').limit(50),
        supabase.from('locais').select('id, nome, slug, categoria, imagem_destaque').eq('ativo', true).order('ordem').limit(100),
        supabase.from('properties').select('id, title, slug, location, thumbnail_url, image_url, transaction_type, condominio_slug').eq('status', 'active').limit(200),
      ]);

      if (cancelled) return;

      type Scored = SearchResult & { score: number };
      const items: Scored[] = [];

      (catRes.data ?? []).forEach((c: any) => {
        const { match, score } = fuzzyMatch(c.nome, debouncedQuery);
        if (match) items.push({ id: c.id, title: c.nome, url: `/guia/categoria/${c.slug}`, type: 'categoria', icon: c.icone, score });
      });

      (localRes.data ?? []).forEach((l: any) => {
        const { match, score } = fuzzyMatch(l.nome, debouncedQuery);
        if (match) items.push({ id: l.id, title: l.nome, subtitle: l.categoria, url: `/locais/${l.slug}`, type: 'local', image: l.imagem_destaque, score });
      });

      (propRes.data ?? []).forEach((p: any) => {
        const { match, score } = fuzzyMatch(p.title || '', debouncedQuery);
        if (match) items.push({ id: p.id, title: p.title || 'Imóvel', subtitle: p.location, url: `/imoveis/${p.transaction_type === 'temporada' ? 'temporada' : 'venda'}/${p.slug || p.id}`, type: 'imovel', image: p.thumbnail_url || p.image_url, score });
      });

      // Sort by score descending, then limit per type
      items.sort((a, b) => b.score - a.score);
      const catItems = items.filter(i => i.type === 'categoria').slice(0, 4);
      const localItems = items.filter(i => i.type === 'local').slice(0, 5);
      const propItems = items.filter(i => i.type === 'imovel').slice(0, 5);
      const final: SearchResult[] = [...catItems, ...localItems, ...propItems];

      setResults(final);
      setHighlightIdx(-1);
      setLoading(false);
    };

    doSearch();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const goToResult = useCallback((result: SearchResult) => {
    setOpen(false);
    setQuery('');
    navigate(result.url);
  }, [navigate]);

  const goToSearch = useCallback(() => {
    if (query.trim()) {
      setOpen(false);
      navigate(`/busca?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  }, [query, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (highlightIdx >= 0 && highlightIdx < results.length) {
        goToResult(results[highlightIdx]);
      } else {
        goToSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, -1));
    }
  };

  // Group results by type
  const grouped = (['categoria', 'local', 'imovel'] as const)
    .map((type) => ({
      type,
      items: results.filter((r) => r.type === type),
    }))
    .filter((g) => g.items.length > 0);

  const showDropdown = open && (results.length > 0 || loading || debouncedQuery.length >= 2);
  const isHeaderVariant = variant === 'header';

  return (
    <>
      {/* Blur backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      <div ref={containerRef} className={cn('relative z-50', className)}>
        {/* ── Header variant: icon trigger → fullscreen mobile / dropdown desktop ── */}
        {isHeaderVariant && !open && (
          <button
            onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>
        )}

        {/* ── Input bar ── */}
        {(variant === 'hero' || open) && (
          <div className={cn(
            isHeaderVariant && open
              ? 'fixed inset-x-0 top-0 md:absolute md:inset-auto md:right-0 md:top-0 md:w-[420px] z-50'
              : 'w-full'
          )}>
            <div className={cn(
              'flex items-center gap-2 transition-all',
              isHeaderVariant && open
                ? 'bg-background p-4 md:p-0 md:bg-transparent border-b border-border md:border-none shadow-lg md:shadow-none'
                : '',
              variant === 'hero'
                ? 'bg-white rounded-xl shadow-hero p-2'
                : ''
            )}>
              <div className={cn(
                'flex items-center gap-2 flex-1',
                variant === 'hero'
                  ? 'px-3 py-2 bg-muted/50 rounded-lg'
                  : 'px-3 py-2.5 bg-background border border-input rounded-lg'
              )}>
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={placeholder}
                  className="bg-transparent outline-none w-full text-sm text-foreground placeholder:text-muted-foreground"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={handleKeyDown}
                />
                {(query || (isHeaderVariant && open)) && (
                  <button onClick={() => { setQuery(''); if (isHeaderVariant) setOpen(false); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {variant === 'hero' && (
                <button
                  onClick={goToSearch}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Pesquisar</span>
                </button>
              )}
            </div>

            {/* ── Dropdown ── */}
            {showDropdown && (
              <div className={cn(
                'bg-background border border-border rounded-xl shadow-xl overflow-hidden',
                isHeaderVariant && open
                  ? 'fixed inset-x-4 top-[72px] md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-[420px] max-h-[70vh] overflow-y-auto'
                  : 'absolute left-0 right-0 top-full mt-2 max-h-[60vh] overflow-y-auto'
              )}>
                {loading && results.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Buscando...</span>
                  </div>
                )}

                {!loading && results.length === 0 && debouncedQuery.length >= 2 && (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    Nenhum resultado para "{debouncedQuery}"
                  </div>
                )}

                {grouped.map((group) => {
                  const config = TYPE_CONFIG[group.type];
                  return (
                    <div key={group.type}>
                      <div className="px-4 py-2 bg-muted/50 border-b border-border">
                        <span className={cn('text-xs font-semibold uppercase tracking-wider', config.color)}>
                          {config.label}
                        </span>
                      </div>
                      {group.items.map((item) => {
                        const globalIdx = results.indexOf(item);
                        const Icon = config.Icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => goToResult(item)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50',
                              globalIdx === highlightIdx && 'bg-accent/50'
                            )}
                          >
                            {item.image ? (
                              <img src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                            ) : item.icon ? (
                              <span className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0">{item.icon}</span>
                            ) : (
                              <div className={cn('h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0', config.color)}>
                                <Icon className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                              {item.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {results.length > 0 && (
                  <button
                    onClick={goToSearch}
                    className="w-full py-3 text-center text-sm font-medium text-primary hover:bg-accent/30 transition-colors border-t border-border"
                  >
                    Ver todos os resultados para "{query}"
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SmartSearch;
