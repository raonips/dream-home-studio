import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Pencil, Trash2, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { collectPropertyImageUrls, removeStorageFiles } from '@/lib/storageCleanup';
import PropertyFormDialog from '@/components/admin/PropertyFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface PropertyRow {
  id: string;
  slug?: string;
  title: string;
  description: string;
  price: number;
  price_formatted: string;
  location: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  tags: string[];
  highlight_tag: string;
  image_url: string;
  images: string[];
  partnership: string;
  property_type: string;
  condominio_slug: string | null;
  status: string;
  seo_title?: string | null;
  seo_description?: string | null;
  transaction_type?: string;
  max_guests?: number;
  daily_rate?: number;
  cleaning_fee?: number;
  ical_url?: string;
}

const AdminProperties = () => {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from('properties').update({ is_featured: !current } as any).eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar destaque' });
    } else {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } as any : p));
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setProperties(data as PropertyRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    // Fetch the property to get all image URLs before deleting
    const target = properties.find((p) => p.id === deleteId);
    if (target) {
      const urls = collectPropertyImageUrls(target);
      await removeStorageFiles(urls);
    }
    const { error } = await supabase.from('properties').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir' });
    } else {
      toast({ title: 'Imóvel excluído com sucesso' });
      fetchProperties();
    }
    setDeleteId(null);
  };

  return (
    <>
      <Helmet><title>Imóveis | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display text-foreground">Imóveis</h1>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Imóvel
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum imóvel cadastrado ainda.
              </div>
            ) : (
              <Table>
                <TableHeader>
                 <TableRow>
                     <TableHead>Foto</TableHead>
                     <TableHead>Título</TableHead>
                     <TableHead className="hidden md:table-cell">Preço</TableHead>
                     <TableHead className="hidden md:table-cell">Tipo</TableHead>
                     <TableHead className="hidden lg:table-cell">Slug</TableHead>
                      <TableHead className="w-12">⭐</TableHead>
                      <TableHead>Status</TableHead>
                     <TableHead className="text-right">Ações</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <img
                          src={p.image_url || '/placeholder.svg'}
                          alt={p.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.price_formatted}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {p.transaction_type === 'temporada' ? '🏖️ Temporada' : p.transaction_type === 'ambos' ? '🔄 Ambos' : '🏠 Venda'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs">{(p as any).slug || '—'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFeatured(p.id, !!(p as any).is_featured)}
                          title={(p as any).is_featured ? 'Remover destaque' : 'Marcar como destaque'}
                        >
                          <Star className={`h-4 w-4 ${(p as any).is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                          {p.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditing(p); setDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeleteId(p.id)}
                          >
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

      <PropertyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSuccess={fetchProperties}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir imóvel?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminProperties;
