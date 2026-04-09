import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/admin/RichTextEditor';
import IconPicker, { RenderIcon } from '@/components/admin/IconPicker';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CondTagRow {
  id: string;
  nome: string;
  slug: string;
  icone: string;
  descricao_seo: string;
}

const generateSlug = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const AdminCondominioTags = () => {
  const [tags, setTags] = useState<CondTagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CondTagRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({ nome: '', slug: '', icone: '', descricao_seo: '' });

  const fetchTags = async () => {
    setLoading(true);
    const { data } = await supabase.from('condominio_tags' as any).select('*').order('nome');
    if (data) setTags(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchTags(); }, []);

  useEffect(() => {
    if (editing) {
      setForm({ nome: editing.nome, slug: editing.slug, icone: editing.icone, descricao_seo: editing.descricao_seo });
    } else {
      setForm({ nome: '', slug: '', icone: '', descricao_seo: '' });
    }
  }, [editing, dialogOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast({ variant: 'destructive', title: 'Nome é obrigatório' });
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      slug: form.slug.trim() || generateSlug(form.nome),
      icone: form.icone,
      descricao_seo: form.descricao_seo,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('condominio_tags' as any).update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('condominio_tags' as any).insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: editing ? 'Tag atualizada' : 'Tag criada com sucesso' });
      setDialogOpen(false);
      fetchTags();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('condominio_tags' as any).delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir' });
    } else {
      toast({ title: 'Tag excluída' });
      fetchTags();
    }
    setDeleteId(null);
  };

  return (
    <>
      <Helmet><title>Tags de Condomínios | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display text-foreground">Tags de Condomínios</h1>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Tag
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhuma tag de condomínio cadastrada.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ícone</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="hidden md:table-cell">Descrição SEO</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {t.icone ? <RenderIcon name={t.icone} className="h-5 w-5 text-primary" /> : '—'}
                      </TableCell>
                      <TableCell className="font-medium">{t.nome}</TableCell>
                      <TableCell className="font-mono text-xs">{t.slug}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {t.descricao_seo ? '✅ Preenchida' : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tag' : 'Nova Tag de Condomínio'}</DialogTitle>
            <DialogDescription>Preencha o nome, ícone e descrição SEO.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm(f => ({
                  ...f,
                  nome: e.target.value,
                  slug: editing ? f.slug : generateSlug(e.target.value),
                }))}
                placeholder="Ex: Piscina"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="gerado-automaticamente"
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <IconPicker value={form.icone} onChange={(v) => setForm(f => ({ ...f, icone: v }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição SEO (conteúdo rico)</Label>
              <RichTextEditor
                value={form.descricao_seo}
                onChange={(val) => setForm(f => ({ ...f, descricao_seo: val }))}
                placeholder="Texto rico exibido na página da tag para SEO..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tag?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminCondominioTags;
