import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, Loader2, Link2, Unlink, Printer, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface PlacaRow {
  id: string;
  id_placa: string;
  imovel_vinculado_id: string | null;
  created_at: string;
  property_title?: string;
}

const SITE_DOMAIN = window.location.origin;

const AdminPlacas = () => {
  const [placas, setPlacas] = useState<PlacaRow[]>([]);
  const [properties, setProperties] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [batchCount, setBatchCount] = useState('10');
  const [linkDialog, setLinkDialog] = useState<PlacaRow | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [placasRes, propsRes] = await Promise.all([
      supabase.from('placas_qr').select('*, properties:imovel_vinculado_id(title)').order('id_placa'),
      supabase.from('properties').select('id, title').eq('status', 'active').order('title'),
    ]);
    if (placasRes.data) {
      setPlacas(placasRes.data.map((p: any) => ({
        ...p,
        property_title: p.properties?.title || null,
      })));
    }
    if (propsRes.data) setProperties(propsRes.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreateBatch = async () => {
    const count = parseInt(batchCount);
    if (isNaN(count) || count < 1 || count > 100) {
      toast({ variant: 'destructive', title: 'Quantidade inválida (1-100)' });
      return;
    }

    // Find next available number
    const existing = placas.map(p => parseInt(p.id_placa)).filter(n => !isNaN(n));
    const maxNum = existing.length > 0 ? Math.max(...existing) : 0;

    const newPlacas = Array.from({ length: count }, (_, i) => ({
      id_placa: String(maxNum + i + 1).padStart(3, '0'),
    }));

    const { error } = await supabase.from('placas_qr').insert(newPlacas as any);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar placas', description: error.message });
    } else {
      toast({ title: `${count} placas criadas com sucesso` });
      fetchAll();
    }
    setCreateOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('placas_qr').delete().eq('id', deleteId);
    if (error) toast({ variant: 'destructive', title: 'Erro ao excluir' });
    else { toast({ title: 'Placa excluída' }); fetchAll(); }
    setDeleteId(null);
  };

  const handleLink = async () => {
    if (!linkDialog || !selectedPropertyId) return;
    const { error } = await supabase.from('placas_qr')
      .update({ imovel_vinculado_id: selectedPropertyId } as any)
      .eq('id', linkDialog.id);
    if (error) toast({ variant: 'destructive', title: 'Erro ao vincular' });
    else { toast({ title: 'Imóvel vinculado com sucesso' }); fetchAll(); }
    setLinkDialog(null);
    setSelectedPropertyId('');
  };

  const handleUnlink = async (placa: PlacaRow) => {
    const { error } = await supabase.from('placas_qr')
      .update({ imovel_vinculado_id: null } as any)
      .eq('id', placa.id);
    if (error) toast({ variant: 'destructive', title: 'Erro ao desvincular' });
    else { toast({ title: 'Imóvel desvinculado' }); fetchAll(); }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrItems = placas.map(p => {
      const url = `${SITE_DOMAIN}/qr/${p.id_placa}`;
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      return `
        <div style="display:inline-block;text-align:center;margin:16px;page-break-inside:avoid;">
          <img src="${qrApiUrl}" width="200" height="200" />
          <div style="margin-top:8px;font-weight:bold;font-size:16px;">Placa ${p.id_placa}</div>
          <div style="font-size:11px;color:#666;">${url}</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>QR Codes - Placas</title>
      <style>body{font-family:sans-serif;padding:20px;} @media print{body{padding:0;}}</style>
      </head><body>
      <h1 style="text-align:center;">QR Codes das Placas</h1>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;">${qrItems}</div>
      <script>window.onload=function(){window.print();}</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <Helmet><title>Gestão de Placas QR | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold font-display text-foreground">Gestão de Placas QR</h1>
          <div className="flex gap-2">
            {placas.length > 0 && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir QR Codes
              </Button>
            )}
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Criar Placas
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : placas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma placa cadastrada. Crie um lote para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>QR Code URL</TableHead>
                    <TableHead>Imóvel Vinculado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-bold">{p.id_placa}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[200px] truncate">
                        {SITE_DOMAIN}/qr/{p.id_placa}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {p.property_title || <span className="text-muted-foreground italic">Nenhum</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.imovel_vinculado_id ? 'default' : 'secondary'}>
                          {p.imovel_vinculado_id ? 'Vinculada' : 'Livre'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {p.imovel_vinculado_id ? (
                            <Button variant="ghost" size="icon" onClick={() => handleUnlink(p)} title="Desvincular">
                              <Unlink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => { setLinkDialog(p); setSelectedPropertyId(''); }} title="Vincular Imóvel">
                              <Link2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(p.id)}>
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

      {/* Create batch dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Lote de Placas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Informe quantas placas deseja criar. Elas serão numeradas sequencialmente a partir da última existente.
            </p>
            <Input
              type="number"
              min={1}
              max={100}
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
              placeholder="Quantidade (ex: 10)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateBatch}>
              <QrCode className="h-4 w-4 mr-2" /> Criar Placas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link property dialog */}
      <Dialog open={!!linkDialog} onOpenChange={() => setLinkDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Imóvel à Placa {linkDialog?.id_placa}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um imóvel..." />
              </SelectTrigger>
              <SelectContent>
                {properties.map((prop) => (
                  <SelectItem key={prop.id} value={prop.id}>{prop.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialog(null)}>Cancelar</Button>
            <Button onClick={handleLink} disabled={!selectedPropertyId}>
              <Link2 className="h-4 w-4 mr-2" /> Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir placa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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

export default AdminPlacas;
