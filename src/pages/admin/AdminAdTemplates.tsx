import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Pencil, Trash2, Loader2, AlertTriangle, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdTemplateFormDialog from '@/components/admin/AdTemplateFormDialog';
import AdTemplateGalleryDialog from '@/components/admin/AdTemplateGalleryDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface AdTemplateRow {
  id: string;
  title: string;
  heading: string;
  subtitle: string;
  button_text: string;
  overlay_style: string;
  target_category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  condominio: 'Condomínio',
  mercado: 'Mercado',
  padaria: 'Padaria',
  restaurante: 'Restaurante',
  hospedagem: 'Hospedagem',
  saude: 'Saúde',
  gas: 'Gás',
  limpeza: 'Materiais de Limpeza',
  farmacia: 'Farmácia',
  utilidade: 'Utilidade',
};

const AdminAdTemplates = () => {
  const [items, setItems] = useState<AdTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdTemplateRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('ad_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setFetchError(`Erro ${error.code || '?'}: ${error.message}`);
        return;
      }
      setItems((data ?? []) as unknown as AdTemplateRow[]);
    } catch (err: any) {
      setFetchError(`Erro inesperado: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleToggle = useCallback(async (id: string, current: boolean) => {
    const { error } = await supabase.from('ad_templates').update({ is_active: !current } as any).eq('id', id);
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); return; }
    setItems(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t));
    toast({ title: !current ? 'Template ativado' : 'Template desativado' });
  }, [toast]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('ad_templates').delete().eq('id', deleteId);
    if (error) { toast({ variant: 'destructive', title: 'Erro', description: error.message }); }
    else { toast({ title: 'Template excluído' }); fetchTemplates(); }
    setDeleteId(null);
  }, [deleteId, toast, fetchTemplates]);

  return (
    <>
      <Helmet><title>Templates de Publicidade | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Templates de Publicidade</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Crie esqueletos de banners vinculados a categorias. Cada local usa sua imagem e URL próprias.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setGalleryOpen(true)} disabled={loading || items.length === 0}>
              <LayoutTemplate className="h-4 w-4 mr-2" /> Ver Modelos Existentes
            </Button>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Template
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium text-destructive">{fetchError}</p>
                <Button variant="outline" size="sm" onClick={fetchTemplates}>Tentar novamente</Button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum template criado ainda. Clique em "Novo Template" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria Alvo</TableHead>
                    <TableHead className="hidden md:table-cell">Título do Banner</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{CATEGORIA_LABELS[t.target_category] || t.target_category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm truncate max-w-[200px]">{t.heading}</TableCell>
                      <TableCell>
                        <Switch checked={t.is_active} onCheckedChange={() => handleToggle(t.id, t.is_active)} />
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

      <AdTemplateFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSuccess={fetchTemplates} />

      <AdTemplateGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        items={items}
        onEdit={(t) => { setGalleryOpen(false); setEditing(t); setDialogOpen(true); }}
        onDelete={(id) => { setGalleryOpen(false); setDeleteId(id); }}
        onToggle={handleToggle}
        onCreateNew={() => { setGalleryOpen(false); setEditing(null); setDialogOpen(true); }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
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

export default AdminAdTemplates;
