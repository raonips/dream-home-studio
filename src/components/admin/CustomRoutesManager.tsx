import { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, Eye, EyeOff, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomRoute {
  id: string;
  url_path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  is_indexed: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  url_path: '',
  title: '',
  description: '',
  keywords: '',
  is_indexed: true,
};

const normalizePath = (raw: string) => {
  let p = (raw || '').trim();
  if (!p) return '';
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p;
};

const CustomRoutesManager = () => {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<CustomRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRoute | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('seo_custom_routes')
      .select('*')
      .order('url_path', { ascending: true });
    if (error) {
      toast({ title: 'Erro ao carregar rotas', description: error.message, variant: 'destructive' });
    } else {
      setRoutes((data as CustomRoute[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (r: CustomRoute) => {
    setEditing(r);
    setForm({
      url_path: r.url_path,
      title: r.title || '',
      description: r.description || '',
      keywords: r.keywords || '',
      is_indexed: r.is_indexed,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const url_path = normalizePath(form.url_path);
    if (!url_path) {
      toast({ title: 'URL obrigatória', description: 'Informe um caminho válido (ex: /tabua-de-mares/imbassai)', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      url_path,
      title: form.title.trim() || null,
      description: form.description.trim() || null,
      keywords: form.keywords.trim() || null,
      is_indexed: form.is_indexed,
    };

    const { error } = editing
      ? await (supabase as any).from('seo_custom_routes').update(payload).eq('id', editing.id)
      : await (supabase as any).from('seo_custom_routes').insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: editing ? 'Rota atualizada' : 'Rota criada', description: url_path });
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (r: CustomRoute) => {
    if (!confirm(`Excluir a rota ${r.url_path}?`)) return;
    const { error } = await (supabase as any).from('seo_custom_routes').delete().eq('id', r.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Rota excluída' });
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5" />
              Links Manuais / Rotas Customizadas
            </CardTitle>
            <CardDescription>
              Cadastre URLs dinâmicas do site (ex: <code>/tabua-de-mares/imbassai</code>) com SEO próprio. Estas rotas serão incluídas automaticamente no <code>sitemap.xml</code>.
            </CardDescription>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> Nova Rota
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">URL</TableHead>
                  <TableHead className="min-w-[220px]">Título SEO</TableHead>
                  <TableHead className="min-w-[260px]">Descrição</TableHead>
                  <TableHead className="w-[100px] text-center">Indexar</TableHead>
                  <TableHead className="w-[110px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.url_path}</TableCell>
                    <TableCell className="text-sm">{r.title || <span className="text-muted-foreground italic">—</span>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground line-clamp-2 max-w-[360px]">{r.description || '—'}</TableCell>
                    <TableCell className="text-center">
                      {r.is_indexed
                        ? <Eye className="h-4 w-4 text-green-600 inline" />
                        : <EyeOff className="h-4 w-4 text-destructive inline" />}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {routes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                      Nenhuma rota customizada cadastrada ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar rota' : 'Nova rota customizada'}</DialogTitle>
            <DialogDescription>
              Preencha os metadados SEO para esta URL. Eles serão usados no sitemap.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL (caminho) *</label>
              <Input
                value={form.url_path}
                onChange={(e) => setForm({ ...form, url_path: e.target.value })}
                placeholder="/tabua-de-mares/imbassai"
                className="mt-1 font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Comece com "/". Não inclua o domínio.</p>
            </div>

            <div>
              <label className="text-sm font-medium">Título SEO</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Tábua de Marés - Imbassaí"
                maxLength={70}
                className="mt-1"
              />
              <span className="text-[10px] text-muted-foreground">{form.title.length}/70</span>
            </div>

            <div>
              <label className="text-sm font-medium">Meta Descrição</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Confira a tábua de marés atualizada da praia de Imbassaí..."
                maxLength={160}
                className="mt-1 min-h-[70px]"
              />
              <span className="text-[10px] text-muted-foreground">{form.description.length}/160</span>
            </div>

            <div>
              <label className="text-sm font-medium">Palavras-chave</label>
              <Input
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="tábua de marés, imbassaí, praia"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_indexed}
                onCheckedChange={(v) => setForm({ ...form, is_indexed: v })}
              />
              <span className="text-sm">
                {form.is_indexed ? 'Incluir no sitemap (indexar)' : 'Não indexar (ocultar)'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomRoutesManager;
