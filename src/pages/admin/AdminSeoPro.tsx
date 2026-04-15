import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2, Save, Search, CheckCircle2, AlertCircle, FileSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PageEntry {
  path: string;
  label: string;
  source: string;
  defaultTitle: string;
  defaultDescription: string;
  customTitle: string;
  customDescription: string;
  hasOverride: boolean;
  dirty: boolean;
  saving: boolean;
}

const FIXED_PAGES: { path: string; label: string; source: string }[] = [
  { path: '/', label: 'Home (Guia)', source: 'Fixa' },
  { path: '/imoveis', label: 'Home Imóveis', source: 'Fixa' },
  { path: '/imoveis/listagem', label: 'Listagem Imóveis', source: 'Fixa' },
  { path: '/imoveis/vendas', label: 'Vendas', source: 'Fixa' },
  { path: '/imoveis/temporada', label: 'Temporada', source: 'Fixa' },
  { path: '/imoveis/condominios', label: 'Condomínios', source: 'Fixa' },
  { path: '/imoveis/contato', label: 'Contato', source: 'Fixa' },
  { path: '/mapa', label: 'Mapa Geral', source: 'Fixa' },
  { path: '/busca', label: 'Busca', source: 'Fixa' },
];

const AdminSeoPro = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const loadAll = useCallback(async () => {
    setLoading(true);

    const [
      overridesRes,
      propertiesRes,
      condominiosRes,
      locaisRes,
      postsRes,
      categoriasRes,
    ] = await Promise.all([
      supabase.from('seo_overrides').select('page_path, seo_title, seo_description'),
      supabase.from('properties').select('slug, title, seo_title, seo_description, transaction_type').eq('status', 'active'),
      supabase.from('condominios').select('slug, name, seo_title, seo_description'),
      supabase.from('locais').select('slug, nome, seo_title, seo_description').eq('ativo', true),
      supabase.from('guia_posts').select('slug, titulo, seo_title, seo_description').eq('status', 'publicado'),
      supabase.from('guia_categorias').select('slug, nome, descricao'),
    ]);

    const overrides = new Map<string, { seo_title: string | null; seo_description: string | null }>();
    (overridesRes.data || []).forEach((o: any) => overrides.set(o.page_path, o));

    const entries: PageEntry[] = [];

    const addEntry = (path: string, label: string, source: string, defTitle: string, defDesc: string) => {
      const ov = overrides.get(path);
      entries.push({
        path,
        label,
        source,
        defaultTitle: defTitle || '',
        defaultDescription: defDesc || '',
        customTitle: ov?.seo_title || '',
        customDescription: ov?.seo_description || '',
        hasOverride: !!ov,
        dirty: false,
        saving: false,
      });
    };

    // Fixed pages
    FIXED_PAGES.forEach((p) => addEntry(p.path, p.label, p.source, '', ''));

    // Properties
    (propertiesRes.data || []).forEach((p: any) => {
      const prefix = p.transaction_type === 'venda' ? 'venda' : 'temporada';
      const path = `/imoveis/${prefix}/${p.slug}`;
      addEntry(path, p.title || p.slug, 'Imóvel', p.seo_title || p.title || '', p.seo_description || '');
    });

    // Condominios
    (condominiosRes.data || []).forEach((c: any) => {
      const path = `/imoveis/condominio/${c.slug}`;
      addEntry(path, c.name || c.slug, 'Condomínio', c.seo_title || c.name || '', c.seo_description || '');
    });

    // Locais
    (locaisRes.data || []).forEach((l: any) => {
      const path = `/locais/${l.slug}`;
      addEntry(path, l.nome || l.slug, 'Local', l.seo_title || l.nome || '', l.seo_description || '');
    });

    // Guia Posts
    (postsRes.data || []).forEach((p: any) => {
      const path = `/${p.slug}`;
      addEntry(path, p.titulo || p.slug, 'Post', p.seo_title || p.titulo || '', p.seo_description || '');
    });

    // Categorias
    (categoriasRes.data || []).forEach((c: any) => {
      const path = `/guia/categoria/${c.slug}`;
      addEntry(path, c.nome || c.slug, 'Categoria', c.nome || '', c.descricao || '');
    });

    setPages(entries);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const updateField = (index: number, field: 'customTitle' | 'customDescription', value: string) => {
    setPages((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value, dirty: true } : p));
  };

  const handleSave = async (index: number) => {
    const entry = pages[index];
    setPages((prev) => prev.map((p, i) => i === index ? { ...p, saving: true } : p));

    const payload = {
      page_path: entry.path,
      seo_title: entry.customTitle.trim() || null,
      seo_description: entry.customDescription.trim() || null,
    };

    const hasContent = payload.seo_title || payload.seo_description;

    let error: any = null;

    if (entry.hasOverride && !hasContent) {
      // Remove override
      const res = await supabase.from('seo_overrides').delete().eq('page_path', entry.path);
      error = res.error;
    } else if (entry.hasOverride) {
      const res = await supabase.from('seo_overrides').update({
        seo_title: payload.seo_title,
        seo_description: payload.seo_description,
      }).eq('page_path', entry.path);
      error = res.error;
    } else if (hasContent) {
      const res = await supabase.from('seo_overrides').insert(payload);
      error = res.error;
    }

    setPages((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, saving: false, dirty: false, hasOverride: !!hasContent }
          : p
      )
    );

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'SEO atualizado!' });
    }
  };

  const sources = ['all', ...new Set(pages.map((p) => p.source))];

  const filtered = pages.filter((p) => {
    if (sourceFilter !== 'all' && p.source !== sourceFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return (
        p.path.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.customTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalOverrides = pages.filter((p) => p.hasOverride).length;

  return (
    <>
      <Helmet><title>SEO PRO | Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <FileSearch className="h-6 w-6" />
            SEO PRO
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie o título e descrição SEO de todas as páginas do site. Campos preenchidos aqui têm prioridade sobre os dados padrão.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          <Card className="flex-1 min-w-[200px]">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-2xl font-bold text-foreground">{pages.length}</div>
              <p className="text-xs text-muted-foreground">Páginas encontradas</p>
            </CardContent>
          </Card>
          <Card className="flex-1 min-w-[200px]">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-2xl font-bold text-green-600">{totalOverrides}</div>
              <p className="text-xs text-muted-foreground">Com SEO customizado</p>
            </CardContent>
          </Card>
          <Card className="flex-1 min-w-[200px]">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-2xl font-bold text-amber-600">{pages.length - totalOverrides}</div>
              <p className="text-xs text-muted-foreground">Usando padrão do sistema</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por URL, nome ou título..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {sources.map((s) => (
              <Badge
                key={s}
                variant={sourceFilter === s ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSourceFilter(s)}
              >
                {s === 'all' ? 'Todos' : s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">Status</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead className="min-w-[200px]">Página / URL</TableHead>
                  <TableHead className="min-w-[250px]">Título SEO</TableHead>
                  <TableHead className="min-w-[300px]">Descrição SEO</TableHead>
                  <TableHead className="w-[80px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry, idx) => {
                  const realIdx = pages.indexOf(entry);
                  return (
                    <TableRow key={entry.path} className={entry.dirty ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                      <TableCell>
                        {entry.hasOverride ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {entry.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm truncate max-w-[250px]" title={entry.label}>
                          {entry.label}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[250px]" title={entry.path}>
                          {entry.path}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={entry.customTitle}
                          onChange={(e) => updateField(realIdx, 'customTitle', e.target.value)}
                          placeholder={entry.defaultTitle || 'Título SEO...'}
                          className="text-sm h-8"
                          maxLength={70}
                        />
                        <span className="text-[10px] text-muted-foreground">{entry.customTitle.length}/70</span>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={entry.customDescription}
                          onChange={(e) => updateField(realIdx, 'customDescription', e.target.value)}
                          placeholder={entry.defaultDescription || 'Descrição SEO...'}
                          className="text-sm min-h-[36px] h-[36px] resize-y"
                          maxLength={160}
                        />
                        <span className="text-[10px] text-muted-foreground">{entry.customDescription.length}/160</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={entry.dirty ? 'default' : 'ghost'}
                          disabled={!entry.dirty || entry.saving}
                          onClick={() => handleSave(realIdx)}
                          className="h-8"
                        >
                          {entry.saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Nenhuma página encontrada com esse filtro.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminSeoPro;
