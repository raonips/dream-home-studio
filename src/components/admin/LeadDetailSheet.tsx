import { useEffect, useState } from 'react';
import { Loader2, Phone, Mail, MessageCircle, Home, Save, Calendar } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  status: string;
  property_id?: string | null;
  notes?: string | null;
  created_at: string;
}

interface PropertyLite {
  id: string;
  title: string | null;
  slug: string | null;
}

const STATUS_OPTIONS = [
  { value: 'sem_atendimento', label: 'Sem Atendimento' },
  { value: 'em_contato', label: 'Em Contato' },
  { value: 'visita_agendada', label: 'Visita Agendada' },
  { value: 'proposta', label: 'Proposta/Negócio' },
  { value: 'fechado', label: 'Contrato/Fechado' },
];

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Lead) => void;
}

export const LeadDetailSheet = ({ lead, open, onOpenChange, onSaved }: Props) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('sem_atendimento');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<PropertyLite | null>(null);

  useEffect(() => {
    if (!lead) return;
    setStatus(lead.status || 'sem_atendimento');
    setNotes(lead.notes || '');
    setProperty(null);

    if (lead.property_id) {
      supabase
        .from('properties')
        .select('id, title, slug')
        .eq('id', lead.property_id)
        .maybeSingle()
        .then(({ data }) => setProperty(data as PropertyLite | null));
    }
  }, [lead]);

  if (!lead) return null;

  const phoneDigits = (lead.phone || '').replace(/\D/g, '');
  const waLink = phoneDigits ? `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`}` : null;
  const createdAt = new Date(lead.created_at);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase.from('leads') as any)
      .update({ status, notes })
      .eq('id', lead.id);
    setSaving(false);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: '✅ Lead atualizado com sucesso' });
    onSaved({ ...lead, status, notes });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{lead.name}</SheetTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Entrou em {createdAt.toLocaleDateString('pt-BR')} às {createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {lead.source && <Badge variant="secondary" className="ml-1 text-[10px]">{lead.source}</Badge>}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contato Rápido */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Contato Rápido</h3>
            <div className="space-y-2">
              {lead.phone && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
                    <Phone className="h-4 w-4" /> {lead.phone}
                  </a>
                  {waLink && (
                    <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
                      <a href={waLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:text-primary"
                >
                  <Mail className="h-4 w-4" /> {lead.email}
                </a>
              )}
            </div>
          </section>

          {/* Interesse */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Interesse</h3>
            {lead.intention && (
              <Badge variant="outline" className="text-xs">{lead.intention}</Badge>
            )}
            {property && (
              <a
                href={`/imoveis/imovel/${property.slug || property.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:text-primary"
              >
                <Home className="h-4 w-4 shrink-0" />
                <span className="truncate">{property.title || 'Ver imóvel'}</span>
              </a>
            )}
            {lead.message ? (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                {lead.message}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Sem mensagem original.</p>
            )}
          </section>

          {/* Status */}
          <section className="space-y-2">
            <Label className="text-sm font-semibold">Estágio no Funil</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {/* Anotações */}
          <section className="space-y-2">
            <Label className="text-sm font-semibold">Anotações do Corretor</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Histórico de conversas, perfil do cliente, próximos passos..."
              className="min-h-[180px] resize-y"
            />
          </section>

          <div className="flex justify-end gap-2 pt-2 pb-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
