import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BlockFormDialog from '@/components/admin/BlockFormDialog';
import BlockItemErrorBoundary from '@/components/admin/BlockItemErrorBoundary';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface GlobalBlockRow {
  id: string;
  title: string;
  html_content: string;
  is_active: boolean;
  target_pages: string[];
  created_at: string;
  updated_at: string;
}

const PAGE_LABELS: Record<string, string> = {
  imovel_detail: 'Detalhe do Imóvel',
  condominio_detail: 'Detalhe do Condomínio',
  imoveis_list: 'Listagem de Imóveis',
  condominios_list: 'Listagem de Condomínios',
  todas: 'Todas as Páginas',
};

const AdminBlocks = () => {
  const [items, setItems] = useState<GlobalBlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GlobalBlockRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      console.log('[AdminBlocks] Fetching blocks...');
      const { data, error } = await supabase
        .from('global_blocks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminBlocks] Fetch error:', error.code, error.message, error.details);
        setFetchError(`Erro ${error.code || '?'}: ${error.message}`);
        return;
      }

      console.log('[AdminBlocks] Fetched', data?.length, 'blocks');
      setItems((data ?? []) as unknown as GlobalBlockRow[]);
    } catch (err: any) {
      console.error('[AdminBlocks] Unexpected fetch error:', err);
      setFetchError(`Erro inesperado: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const handleToggle = useCallback(async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('global_blocks')
        .update({ is_active: !currentState } as any)
        .eq('id', id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao alternar', description: `${error.code}: ${error.message}` });
        return;
      }
      setItems((prev) => prev.map((b) => b.id === id ? { ...b, is_active: !currentState } : b));
      toast({ title: !currentState ? 'Bloco ativado' : 'Bloco desativado' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro inesperado', description: err?.message });
    }
  }, [toast]);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from('global_blocks').delete().eq('id', deleteId);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
        return;
      }
      toast({ title: 'Bloco excluído' });
      setDeleteId(null);
      fetchBlocks();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro inesperado', description: err?.message });
      setDeleteId(null);
    }
  }, [deleteId, toast, fetchBlocks]);

  return (
    <>
      <Helmet><title>Blocos & Publicidade | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Blocos & Publicidade</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie conteúdo HTML global injetado nas páginas públicas do site.
            </p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Bloco
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium text-destructive">{fetchError}</p>
                <Button variant="outline" size="sm" onClick={fetchBlocks}>Tentar novamente</Button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum bloco criado ainda. Clique em "Novo Bloco" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead className="hidden md:table-cell">Páginas</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((block) => (
                    <BlockItemErrorBoundary key={block.id} blockTitle={block.title}>
                      <TableRow>
                        <TableCell className="font-medium">{block.title}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(block.target_pages ?? []).map((p) => (
                              <Badge key={p} variant="secondary" className="text-xs">
                                {PAGE_LABELS[p] || p}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={block.is_active}
                            onCheckedChange={() => handleToggle(block.id, block.is_active)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditing(block); setDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(block.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </BlockItemErrorBoundary>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <BlockFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSuccess={fetchBlocks} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir bloco?</AlertDialogTitle>
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

export default AdminBlocks;
