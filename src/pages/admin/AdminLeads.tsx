import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2, Trash2, MailOpen, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  intention: string | null;
  is_read: boolean;
  created_at: string;
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = async () => {
    setLoading(true);
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data as unknown as Lead[]);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleDelete = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
    toast({ title: 'Lead removido' });
    fetchLeads();
  };

  const toggleRead = async (id: string, current: boolean) => {
    await (supabase.from('leads') as any).update({ is_read: !current }).eq('id', id);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, is_read: !current } : l));
    toast({ title: !current ? 'Marcado como lido' : 'Marcado como não lido' });
  };

  const unreadCount = leads.filter((l) => !l.is_read).length;

  return (
    <>
      <Helmet><title>Leads | Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-display text-foreground">Leads / Contatos</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} novo{unreadCount > 1 ? 's' : ''}</Badge>
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Nenhum lead recebido.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="hidden md:table-cell">E-mail</TableHead>
                      <TableHead className="hidden md:table-cell">Telefone</TableHead>
                      <TableHead className="hidden lg:table-cell">Mensagem</TableHead>
                      <TableHead className="hidden lg:table-cell">Intenção</TableHead>
                      <TableHead className="hidden lg:table-cell">Origem</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((l) => (
                      <TableRow key={l.id} className={l.is_read ? 'opacity-60' : 'bg-primary/5'}>
                        <TableCell>
                          {l.is_read
                            ? <MailOpen className="h-4 w-4 text-muted-foreground" />
                            : <Mail className="h-4 w-4 text-primary" />
                          }
                        </TableCell>
                        <TableCell className={`font-medium ${!l.is_read ? 'font-bold' : ''}`}>{l.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{l.email || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell">{l.phone || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-muted-foreground text-xs">
                          {l.message || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {l.intention ? <Badge variant="secondary">{l.intention}</Badge> : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">{l.source}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(l.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" title={l.is_read ? 'Marcar não lido' : 'Marcar como lido'} onClick={() => toggleRead(l.id, l.is_read)}>
                            {l.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(l.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminLeads;
