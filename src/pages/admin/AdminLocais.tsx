import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LocalFormDialog, { type LocalRow } from '@/components/admin/LocalFormDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CATEGORIAS = [
  { value: 'condominio', label: 'Condomínio' },
  { value: 'mercado', label: 'Mercado' },
  { value: 'padaria', label: 'Padaria' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'hospedagem', label: 'Hospedagem' },
  { value: 'saude', label: 'Saúde' },
  { value: 'gas', label: 'Gás' },
  { value: 'limpeza', label: 'Materiais de Limpeza' },
  { value: 'farmacia', label: 'Farmácia' },
  { value: 'utilidade', label: 'Utilidade' },
];

const AdminLocais = () => {
  const [items, setItems] = useState<LocalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LocalRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('all');
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from('locais').select('*').order('ordem', { ascending: true }).order('nome', { ascending: true });
    if (data) setItems(data as unknown as LocalRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('locais').delete().eq('id', deleteId);
    toast({ title: 'Local excluído' });
    setDeleteId(null);
    fetchItems();
  };

  const filtered = filterCat === 'all' ? items : items.filter((l) => l.categoria === filterCat);

  return (
    <>
      <Helmet><title>Locais | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Locais & Estabelecimentos</h1>
            <p className="text-sm text-muted-foreground">Gerencie mercados, restaurantes, condomínios e outros locais</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Local
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm">Filtrar:</Label>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhum local encontrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="hidden md:table-cell">Slug</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((local) => (
                    <TableRow key={local.id}>
                      <TableCell>
                        <img src={local.imagem_destaque || '/placeholder.svg'} alt={local.nome} className="w-12 h-12 rounded object-cover" />
                      </TableCell>
                      <TableCell className="font-medium">{local.nome}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{CATEGORIAS.find((c) => c.value === local.categoria)?.label || local.categoria}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">/locais/{local.slug}</TableCell>
                      <TableCell>
                        {local.ativo
                          ? <Badge className="bg-green-100 text-green-800">Sim</Badge>
                          : <Badge variant="outline">Não</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(local); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(local.id)}>
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

      <LocalFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSuccess={fetchItems} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir local?</AlertDialogTitle>
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

export default AdminLocais;
