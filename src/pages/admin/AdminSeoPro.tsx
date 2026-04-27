import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2, Save, Search, CheckCircle2, AlertCircle, FileSearch, ExternalLink, Copy, RefreshCw, Home, MapPinned, Newspaper, Building2, FolderOpen, FileText, SearchCheck, Eye, EyeOff, Settings2, ArrowRightLeft, Link2 } from 'lucide-react';
import RedirectsManager from '@/components/admin/RedirectsManager';
import CustomRoutesManager from '@/components/admin/CustomRoutesManager';
import { Switch } from '@/components/ui/switch';
import SeoAdvancedDialog, { type SeoAdvancedValues } from '@/components/admin/SeoAdvancedDialog';
import OgImageStatusIcon from '@/components/admin/OgImageStatusIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── SEO Overrides types ──
interface PageEntry {
  path: string;
  label: string;
  source: string;
  defaultTitle: string;
  defaultDescription: string;
  customTitle: string;
  customDescription: string;
  ogImage: string;
  isIndexed: boolean;
  sitelinks: { title: string; url: string }[];
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

// ── Sitemap types ──
interface SitemapStats {
  total: number;
  properties_venda: number;
  properties_temporada: number;
  locais: number;
  guia_posts: number;
  guia_categorias: number;
  condominios: number;
  static_pages: number;
}

const SITEMAP_EDGE_URL = `https://nfzkreaylakmvlrbbjci.supabase.co/functions/v1/sitemap`;
const SITEMAP_PROD_URL = `https://barradojacuipe.com.br/sitemap.xml`;

// ── Sitemap Tab ──
const SitemapTab = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sitemap', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (error) throw error;
      // supabase.functions.invoke may return text for non-json; ensure object
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (!parsed || typeof parsed.total !== 'number') {
        throw new Error('Resposta inválida da função sitemap');
      }
      setStats(parsed as SitemapStats);
    } catch (e: any) {
      toast({ title: "Erro ao carregar sitemap", description: e?.message || 'Falha desconhecida', variant: "destructive" });
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleCopy = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: `${label} copiado para a área de transferência.` });
  };

  const statCards = stats ? [
    { label: "Imóveis Venda", count: stats.properties_venda, icon: Home, color: "text-blue-600" },
    { label: "Imóveis Temporada", count: stats.properties_temporada, icon: Home, color: "text-purple-600" },
    { label: "Condomínios", count: stats.condominios, icon: Building2, color: "text-emerald-600" },
    { label: "Locais (Guia)", count: stats.locais, icon: MapPinned, color: "text-orange-600" },
    { label: "Posts do Guia", count: stats.guia_posts, icon: Newspaper, color: "text-rose-600" },
    { label: "Categorias Guia", count: stats.guia_categorias, icon: FolderOpen, color: "text-amber-600" },
    { label: "Páginas Fixas", count: stats.static_pages, icon: FileText, color: "text-slate-600" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          O sitemap é gerado dinamicamente. Envie a URL oficial ao Google Search Console.
        </p>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {stats && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de URLs no Sitemap</p>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Prontas para o Google
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acesso ao Sitemap</CardTitle>
          <CardDescription>
            Envie a URL oficial ao Google Search Console. Use a URL de backup para acessar os dados diretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <Badge className="bg-green-600 hover:bg-green-700">Produção</Badge>
              URL Oficial — envie esta ao Google
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 rounded-md bg-muted font-mono text-sm break-all">
                {SITEMAP_PROD_URL}
              </div>
              <Button size="icon" variant="outline" onClick={() => handleCopy(SITEMAP_PROD_URL, "URL Oficial")}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => window.open(SITEMAP_PROD_URL, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <Badge variant="secondary">Backup</Badge>
              URL da Edge Function (fonte dos dados)
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 rounded-md bg-muted font-mono text-sm break-all">
                {SITEMAP_EDGE_URL}
              </div>
              <Button size="icon" variant="outline" onClick={() => handleCopy(SITEMAP_EDGE_URL, "URL Backup")}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => window.open(`${SITEMAP_EDGE_URL}?_=${Date.now()}`, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Main Component ──
const AdminSeoPro = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [advancedIdx, setAdvancedIdx] = useState<number | null>(null);
  const [globalOg, setGlobalOg] = useState({ imoveis: '', guia: '' });

  const loadAll = useCallback(async () => {
    setLoading(true);

    const [
      overridesRes, propertiesRes, condominiosRes, locaisRes, postsRes, categoriasRes,
      siteSettingsRes, guiaSettingsRes,
    ] = await Promise.all([
      supabase.from('seo_overrides').select('page_path, seo_title, seo_description, og_image, is_indexed, sitelinks'),
      supabase.from('properties').select('slug, title, seo_title, seo_description, transaction_type').eq('status', 'active'),
      supabase.from('condominios').select('slug, name, seo_title, seo_description'),
      supabase.from('locais').select('slug, nome, seo_title, seo_description').eq('ativo', true),
      supabase.from('guia_posts').select('slug, titulo, seo_title, seo_description').eq('status', 'publicado'),
      supabase.from('guia_categorias').select('slug, nome, descricao'),
      supabase.from('site_settings').select('og_image_url').limit(1).maybeSingle(),
      supabase.from('guia_site_settings').select('og_image_url').limit(1).maybeSingle(),
    ]);

    setGlobalOg({
      imoveis: (siteSettingsRes.data as any)?.og_image_url || '',
      guia: (guiaSettingsRes.data as any)?.og_image_url || '',
    });

    const overrides = new Map<string, { seo_title: string | null; seo_description: string | null; og_image: string | null; is_indexed: boolean; sitelinks: { title: string; url: string }[] }>();
    (overridesRes.data || []).forEach((o: any) => {
      const sl = Array.isArray(o.sitelinks)
        ? o.sitelinks
            .filter((s: any) => s && typeof s === 'object')
            .map((s: any) => ({ title: String(s.title || ''), url: String(s.url || '') }))
            .filter((s: any) => s.title.trim() && s.url.trim())
            .slice(0, 4)
        : [];
      overrides.set(o.page_path, { ...o, is_indexed: o.is_indexed ?? true, og_image: o.og_image ?? null, sitelinks: sl });
    });

    const entries: PageEntry[] = [];
    const addEntry = (path: string, label: string, source: string, defTitle: string, defDesc: string) => {
      const ov = overrides.get(path);
      entries.push({
        path, label, source,
        defaultTitle: defTitle || '', defaultDescription: defDesc || '',
        customTitle: ov?.seo_title || '', customDescription: ov?.seo_description || '',
        ogImage: ov?.og_image || '',
        isIndexed: ov?.is_indexed ?? true,
        sitelinks: ov?.sitelinks || [],
        hasOverride: !!ov, dirty: false, saving: false,
      });
    };

    FIXED_PAGES.forEach((p) => addEntry(p.path, p.label, p.source, '', ''));
    (propertiesRes.data || []).forEach((p: any) => {
      const prefix = p.transaction_type === 'venda' ? 'venda' : 'temporada';
      addEntry(`/imoveis/${prefix}/${p.slug}`, p.title || p.slug, 'Imóvel', p.seo_title || p.title || '', p.seo_description || '');
    });
    (condominiosRes.data || []).forEach((c: any) => addEntry(`/imoveis/condominio/${c.slug}`, c.name || c.slug, 'Condomínio', c.seo_title || c.name || '', c.seo_description || ''));
    (locaisRes.data || []).forEach((l: any) => addEntry(`/locais/${l.slug}`, l.nome || l.slug, 'Local', l.seo_title || l.nome || '', l.seo_description || ''));
    (postsRes.data || []).forEach((p: any) => addEntry(`/${p.slug}`, p.titulo || p.slug, 'Post', p.seo_title || p.titulo || '', p.seo_description || ''));
    (categoriasRes.data || []).forEach((c: any) => addEntry(`/guia/categoria/${c.slug}`, c.nome || c.slug, 'Categoria', c.nome || '', c.descricao || ''));

    setPages(entries);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const updateField = (index: number, field: 'customTitle' | 'customDescription', value: string) => {
    setPages((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value, dirty: true } : p));
  };

  const toggleIndexed = (index: number) => {
    setPages((prev) => prev.map((p, i) => i === index ? { ...p, isIndexed: !p.isIndexed, dirty: true } : p));
  };

  // Save by index using the up-to-date page state (avoids stale closure when called from dialog).
  const persist = async (entry: PageEntry, index: number) => {
    const cleanedSitelinks = (entry.sitelinks || [])
      .map((s) => ({ title: (s.title || '').trim(), url: (s.url || '').trim() }))
      .filter((s) => s.title && s.url)
      .slice(0, 4);
    const payload = {
      page_path: entry.path,
      seo_title: entry.customTitle.trim() || null,
      seo_description: entry.customDescription.trim() || null,
      og_image: entry.ogImage.trim() || null,
      is_indexed: entry.isIndexed,
      sitelinks: cleanedSitelinks,
    };
    const hasContent = !!(payload.seo_title || payload.seo_description || payload.og_image || !payload.is_indexed || cleanedSitelinks.length > 0);
    let error: any = null;

    if (entry.hasOverride && !hasContent) {
      const res = await supabase.from('seo_overrides').delete().eq('page_path', entry.path);
      error = res.error;
    } else if (entry.hasOverride) {
      const res = await supabase.from('seo_overrides').update({
        seo_title: payload.seo_title,
        seo_description: payload.seo_description,
        og_image: payload.og_image,
        is_indexed: payload.is_indexed,
        sitelinks: cleanedSitelinks as any,
      } as any).eq('page_path', entry.path);
      error = res.error;
    } else if (hasContent) {
      const res = await supabase.from('seo_overrides').insert(payload as any);
      error = res.error;
    }

    setPages((prev) => prev.map((p, i) => i === index ? { ...p, saving: false, dirty: false, hasOverride: hasContent } : p));

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
      throw error;
    }
    toast({ title: 'SEO atualizado!' });
  };

  const handleSave = async (index: number) => {
    setPages((prev) => prev.map((p, i) => i === index ? { ...p, saving: true } : p));
    try { await persist(pages[index], index); } catch {}
  };

  const handleAdvancedSave = async (index: number, values: SeoAdvancedValues) => {
    const updated: PageEntry = {
      ...pages[index],
      customTitle: values.customTitle,
      customDescription: values.customDescription,
      ogImage: values.ogImage,
      isIndexed: values.isIndexed,
      sitelinks: values.sitelinks || [],
      saving: true,
    };
    setPages((prev) => prev.map((p, i) => i === index ? updated : p));
    await persist(updated, index);
  };

  const fallbackForPath = (path: string) =>
    path.startsWith('/imoveis') ? globalOg.imoveis : globalOg.guia;

  const sources = ['all', ...new Set(pages.map((p) => p.source))];
  const filtered = pages.filter((p) => {
    if (sourceFilter !== 'all' && p.source !== sourceFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return p.path.toLowerCase().includes(q) || p.label.toLowerCase().includes(q) || p.customTitle.toLowerCase().includes(q);
    }
    return true;
  });

  const totalOverrides = pages.filter((p) => p.hasOverride).length;

  return (
    <>
      <Helmet><title>SEO PRO | Admin</title></Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
            <SearchCheck className="h-6 w-6" />
            SEO PRO
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Central de SEO: metadados, sitemap e indexação do site.
          </p>
        </div>

        <Tabs defaultValue="metadados" className="w-full">
          <TabsList>
            <TabsTrigger value="metadados" className="gap-1.5">
              <FileSearch className="h-4 w-4" />
              Metadados e URLs
            </TabsTrigger>
            <TabsTrigger value="sitemap" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Sitemap e Indexação
            </TabsTrigger>
            <TabsTrigger value="custom-routes" className="gap-1.5">
              <Link2 className="h-4 w-4" />
              Links Manuais
            </TabsTrigger>
            <TabsTrigger value="redirects" className="gap-1.5">
              <ArrowRightLeft className="h-4 w-4" />
              Redirecionamentos
            </TabsTrigger>
          </TabsList>

          {/* ── Aba Metadados ── */}
          <TabsContent value="metadados">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6 mt-4">
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
                    <Input placeholder="Filtrar por URL, nome ou título..." value={filter} onChange={(e) => setFilter(e.target.value)} className="pl-9" />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {sources.map((s) => (
                      <Badge key={s} variant={sourceFilter === s ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSourceFilter(s)}>
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
                          <TableHead className="w-[80px] text-center">Indexar</TableHead>
                          <TableHead className="w-[110px] text-center">OG / Avançado</TableHead>
                          <TableHead className="w-[80px]">Salvar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((entry) => {
                          const realIdx = pages.indexOf(entry);
                          const hasCustomOg = !!entry.ogImage;
                          return (
                            <TableRow key={entry.path} className={entry.dirty ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                              <TableCell>
                                {entry.hasOverride ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-muted-foreground/40" />}
                              </TableCell>
                              <TableCell><Badge variant="secondary" className="text-xs font-normal">{entry.source}</Badge></TableCell>
                              <TableCell>
                                <div className="font-medium text-sm truncate max-w-[250px]" title={entry.label}>{entry.label}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[250px]" title={entry.path}>{entry.path}</div>
                              </TableCell>
                              <TableCell>
                                <Input value={entry.customTitle} onChange={(e) => updateField(realIdx, 'customTitle', e.target.value)} placeholder={entry.defaultTitle || 'Título SEO...'} className="text-sm h-8" maxLength={70} />
                                <span className="text-[10px] text-muted-foreground">{entry.customTitle.length}/70</span>
                              </TableCell>
                              <TableCell>
                                <Textarea value={entry.customDescription} onChange={(e) => updateField(realIdx, 'customDescription', e.target.value)} placeholder={entry.defaultDescription || 'Descrição SEO...'} className="text-sm min-h-[36px] h-[36px] resize-y" maxLength={160} />
                                <span className="text-[10px] text-muted-foreground">{entry.customDescription.length}/160</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Switch checked={entry.isIndexed} onCheckedChange={() => toggleIndexed(realIdx)} />
                                  {entry.isIndexed ? <Eye className="h-3.5 w-3.5 text-green-600" /> : <EyeOff className="h-3.5 w-3.5 text-destructive" />}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <OgImageStatusIcon
                                    path={entry.path}
                                    hasCustomOg={hasCustomOg}
                                    isStaticOnly={entry.source === 'Fixa'}
                                  />
                                  <Button
                                    size="icon" variant="ghost" className="h-8 w-8"
                                    onClick={() => setAdvancedIdx(realIdx)}
                                    title="SEO Avançado"
                                  >
                                    <Settings2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant={entry.dirty ? 'default' : 'ghost'} disabled={!entry.dirty || entry.saving} onClick={() => handleSave(realIdx)} className="h-8">
                                  {entry.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {filtered.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">Nenhuma página encontrada com esse filtro.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ── Aba Sitemap ── */}
          <TabsContent value="sitemap">
            <div className="mt-4">
              <SitemapTab />
            </div>
          </TabsContent>

          {/* ── Aba Rotas Customizadas ── */}
          <TabsContent value="custom-routes">
            <div className="mt-4">
              <CustomRoutesManager />
            </div>
          </TabsContent>

          {/* ── Aba Redirecionamentos ── */}
          <TabsContent value="redirects">
            <div className="mt-4">
              <RedirectsManager />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {advancedIdx !== null && pages[advancedIdx] && (
        <SeoAdvancedDialog
          open={advancedIdx !== null}
          onOpenChange={(o) => { if (!o) setAdvancedIdx(null); }}
          path={pages[advancedIdx].path}
          label={pages[advancedIdx].label}
          defaultTitle={pages[advancedIdx].defaultTitle}
          defaultDescription={pages[advancedIdx].defaultDescription}
          fallbackOgImage={fallbackForPath(pages[advancedIdx].path)}
          initial={{
            customTitle: pages[advancedIdx].customTitle,
            customDescription: pages[advancedIdx].customDescription,
            ogImage: pages[advancedIdx].ogImage,
            isIndexed: pages[advancedIdx].isIndexed,
            sitelinks: pages[advancedIdx].sitelinks || [],
          }}
          onSave={(values) => handleAdvancedSave(advancedIdx, values)}
        />
      )}
    </>
  );
};

export default AdminSeoPro;
