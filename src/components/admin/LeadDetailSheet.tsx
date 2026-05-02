import { useEffect, useState, useCallback } from 'react';
import { Loader2, Phone, Mail, MessageCircle, Home, Save, Calendar, Target, Search, BedDouble } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  radar_preco_alvo?: number | null;
  radar_quartos_min?: number | null;
  radar_condominio?: string | null;
  created_at: string;
}

interface PropertyLite {
  id: string;
  title: string | null;
  slug: string | null;
}

interface MatchProperty {
  id: string;
  title: string | null;
  slug: string | null;
  price: number | null;
  price_formatted: string | null;
  bedrooms: number | null;
  featured_image: string | null;
  thumbnail_url: string | null;
  image_url: string | null;
  condominio_slug: string | null;
  location: string | null;
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

const formatBRL = (n: number | null | undefined) =>
  typeof n === 'number'
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '—';

export const LeadDetailSheet = ({ lead, open, onOpenChange, onSaved }: Props) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('sem_atendimento');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<PropertyLite | null>(null);

  // Radar
  const [radarPreco, setRadarPreco] = useState<string>('');
  const [radarQuartos, setRadarQuartos] = useState<string>('');
  const [radarCond, setRadarCond] = useState<string>('');
  const [matches, setMatches] = useState<MatchProperty[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setStatus(lead.status || 'sem_atendimento');
    setNotes(lead.notes || '');
    setRadarPreco(lead.radar_preco_alvo != null ? String(lead.radar_preco_alvo) : '');
    setRadarQuartos(lead.radar_quartos_min != null ? String(lead.radar_quartos_min) : '');
    setRadarCond(lead.radar_condominio || '');
    setProperty(null);
    setMatches([]);

    if (lead.property_id) {
      supabase
        .from('properties')
        .select('id, title, slug')
        .eq('id', lead.property_id)
        .maybeSingle()
        .then(({ data }) => setProperty(data as PropertyLite | null));
    }
  }, [lead]);

  const fetchMatches = useCallback(async () => {
    const preco = parseFloat(radarPreco);
    const quartos = parseInt(radarQuartos, 10);
    const cond = radarCond.trim();

    if (!preco && !quartos && !cond) {
      setMatches([]);
      return;
    }

    setLoadingMatches(true);
    let query = supabase
      .from('properties')
      .select('id, title, slug, price, price_formatted, bedrooms, featured_image, thumbnail_url, image_url, condominio_slug, location')
      .eq('status', 'active')
      .limit(30);

    if (!isNaN(preco) && preco > 0) {
      query = query.gte('price', preco * 0.8).lte('price', preco * 1.2);
    }
    if (!isNaN(quartos) && quartos > 0) {
      query = query.gte('bedrooms', quartos);
    }
    if (cond) {
      // Match flexível em condominio_slug OU location
      query = query.or(`condominio_slug.ilike.%${cond}%,location.ilike.%${cond}%`);
    }

    const { data, error } = await query.order('price', { ascending: true });
    setLoadingMatches(false);
    if (error) {
      console.error('[Radar] erro ao buscar matches:', error);
      return;
    }
    setMatches((data || []) as MatchProperty[]);
  }, [radarPreco, radarQuartos, radarCond]);

  // Auto-fetch quando o lead abre ou os filtros mudam (debounce simples)
  useEffect(() => {
    if (!open || !lead) return;
    const t = setTimeout(() => { fetchMatches(); }, 300);
    return () => clearTimeout(t);
  }, [open, lead, fetchMatches]);

  if (!lead) return null;

  const phoneDigits = (lead.phone || '').replace(/\D/g, '');
  const waBase = phoneDigits ? `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`}` : null;
  const createdAt = new Date(lead.created_at);

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, any> = {
      status,
      notes,
      radar_preco_alvo: radarPreco ? Number(radarPreco) : null,
      radar_quartos_min: radarQuartos ? Number(radarQuartos) : null,
      radar_condominio: radarCond.trim() || null,
    };
    const { error } = await (supabase.from('leads') as any).update(updates).eq('id', lead.id);
    setSaving(false);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: '✅ Lead atualizado com sucesso' });
    onSaved({ ...lead, ...updates } as Lead);
    onOpenChange(false);
  };

  const recommendOnWhatsApp = (m: MatchProperty) => {
    if (!waBase) {
      toast({ title: 'Lead sem telefone', variant: 'destructive' });
      return;
    }
    const url = `${window.location.origin}/imoveis/imovel/${m.slug || m.id}`;
    const msg = `Olá ${lead.name.split(' ')[0]}! Encontrei este imóvel que combina com o que você procura:\n\n*${m.title || 'Imóvel'}*\n${m.price_formatted || formatBRL(m.price)}${m.bedrooms ? ` · ${m.bedrooms} quartos` : ''}\n\n${url}`;
    window.open(`${waBase}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
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

        <Tabs defaultValue="ficha" className="mt-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="ficha">Ficha do Lead</TabsTrigger>
            <TabsTrigger value="radar" className="gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Radar 🎯 {matches.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{matches.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: FICHA DO LEAD */}
          <TabsContent value="ficha" className="mt-6 space-y-6">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Contato Rápido</h3>
              <div className="space-y-2">
                {lead.phone && (
                  <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2">
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
                      <Phone className="h-4 w-4" /> {lead.phone}
                    </a>
                    {waBase && (
                      <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
                        <a href={waBase} target="_blank" rel="noopener noreferrer">
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

            <section className="space-y-2">
              <Label className="text-sm font-semibold">Anotações do Corretor</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Histórico de conversas, perfil do cliente, próximos passos..."
                className="min-h-[180px] resize-y"
              />
            </section>
          </TabsContent>

          {/* ABA 2: RADAR DE IMÓVEIS */}
          <TabsContent value="radar" className="mt-6 space-y-5">
            <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Perfil de Busca</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs">Preço Alvo (R$)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={radarPreco}
                    onChange={(e) => setRadarPreco(e.target.value)}
                    placeholder="800000"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs">Mín. Quartos</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={radarQuartos}
                    onChange={(e) => setRadarQuartos(e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Condomínio / Região</Label>
                  <Input
                    value={radarCond}
                    onChange={(e) => setRadarCond(e.target.value)}
                    placeholder="villas-do-jacuipe ou região"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Faixa de preço: ±20% do alvo. Salve as alterações para persistir o perfil.
              </p>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Imóveis Compatíveis {matches.length > 0 && <Badge variant="secondary">{matches.length}</Badge>}
                </h3>
              </div>

              {loadingMatches ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : matches.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8 italic">
                  Nenhum imóvel compatível. Ajuste o perfil de busca acima.
                </p>
              ) : (
                <div className="space-y-2">
                  {matches.map((m) => {
                    const img = m.featured_image || m.thumbnail_url || m.image_url || '/placeholder.svg';
                    return (
                      <div key={m.id} className="flex gap-3 rounded-md border border-border bg-card p-2">
                        <img src={img} alt={m.title || ''} className="h-16 w-20 shrink-0 rounded object-cover" loading="lazy" />
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-foreground truncate">{m.title || 'Imóvel'}</p>
                            <p className="text-xs text-primary font-medium">{m.price_formatted || formatBRL(m.price)}</p>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {m.bedrooms ? <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{m.bedrooms}q</span> : null}
                              {m.condominio_slug && <span className="truncate">{m.condominio_slug}</span>}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 self-start gap-1.5 text-[11px]"
                            onClick={() => recommendOnWhatsApp(m)}
                            disabled={!waBase}
                          >
                            <MessageCircle className="h-3 w-3" />
                            Recomendar no WhatsApp
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-6 pb-4 border-t mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
