import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { collectCondominioImageUrls, removeStorageFiles } from '@/lib/storageCleanup';
import CondominioFormDialog from '@/components/admin/CondominioFormDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface CondominioRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  hero_image: string;
  images: string[];
  infrastructure: string[];
  location_filter: string;
  seo_title?: string | null;
  seo_description?: string | null;
}

const AdminCondominios = () => {
  const [items, setItems] = useState<CondominioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CondominioRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('condominios').select('*').order('name');
    if (data) setItems(data as unknown as CondominioRow[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const target = items.find((c) => c.id === deleteId);
    if (target) {
      const urls = collectCondominioImageUrls(target);
      await removeStorageFiles(urls);
    }
    await supabase.from('condominios').delete().eq('id', deleteId);
    toast({ title: 'Condomínio excluído' });
    setDeleteId(null);
    fetch();
  };

  return (
    <>
      <Helmet><title>Condomínios | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display text-foreground">Condomínios</h1>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Condomínio
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhum condomínio cadastrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Slug</TableHead>
                    <TableHead className="hidden lg:table-cell">Infraestrutura</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <img src={c.hero_image || '/placeholder.svg'} alt={c.name} className="w-12 h-12 rounded object-cover" />
                      </TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{c.slug}</TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                        {c.infrastructure.slice(0, 3).join(', ')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(c.id)}>
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

      <CondominioFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSuccess={fetch} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir condomínio?</AlertDialogTitle>
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

export default AdminCondominios;
