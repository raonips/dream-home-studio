import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensors,
  useSensor,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Loader2, Phone, Mail, Snowflake, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LeadDetailSheet } from '@/components/admin/LeadDetailSheet';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  intention: string | null;
  status: string;
  geladeira: boolean;
  arquivado: boolean;
  is_read: boolean;
  created_at: string;
  property_id?: string | null;
  notes?: string | null;
}

const COLUMNS = [
  { id: 'sem_atendimento', label: 'Sem Atendimento', color: 'bg-muted' },
  { id: 'em_contato', label: 'Em Contato', color: 'bg-blue-500/10' },
  { id: 'visita_agendada', label: 'Visita Agendada', color: 'bg-amber-500/10' },
  { id: 'proposta', label: 'Proposta/Negócio', color: 'bg-purple-500/10' },
  { id: 'fechado', label: 'Contrato/Fechado', color: 'bg-green-500/10' },
];

const COLUMN_BADGE_COLORS: Record<string, string> = {
  sem_atendimento: 'bg-muted-foreground/20 text-muted-foreground',
  em_contato: 'bg-blue-100 text-blue-700',
  visita_agendada: 'bg-amber-100 text-amber-700',
  proposta: 'bg-purple-100 text-purple-700',
  fechado: 'bg-green-100 text-green-700',
};

const DroppableColumn = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className || ''} ${isOver ? 'ring-2 ring-primary/30' : ''}`}>
      {children}
    </div>
  );
};

const DraggableCard = ({ lead, onOpen }: { lead: Lead; onOpen: (l: Lead) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: isDragging ? 50 : undefined }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Só abre se não foi um drag (dnd-kit consome o evento via PointerSensor distance:5)
        if (!isDragging) onOpen(lead);
      }}
      className={`bg-card rounded-lg border border-border p-3 space-y-2 shadow-sm cursor-pointer hover:border-primary/40 hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 cursor-grabbing' : ''
      }`}
    >
      <LeadCardContent lead={lead} />
    </div>
  );
};

const LeadCardContent = ({ lead }: { lead: Lead }) => (
  <>
    <p className="font-semibold text-sm text-foreground leading-tight">{lead.name}</p>
    {lead.intention && (
      <Badge variant="outline" className="text-[10px] font-normal">{lead.intention}</Badge>
    )}
    <div className="flex flex-col gap-1">
      {lead.phone && (
        <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Phone className="h-3 w-3" /> {lead.phone}
        </a>
      )}
      {lead.email && (
        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors truncate">
          <Mail className="h-3 w-3" /> {lead.email}
        </a>
      )}
    </div>
    {lead.message && (
      <p className="text-[11px] text-muted-foreground line-clamp-2">{lead.message}</p>
    )}
    <div className="flex items-center justify-between pt-1">
      <span className="text-[10px] text-muted-foreground">
        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
      </span>
      {lead.source && (
        <Badge variant="secondary" className="text-[9px]">{lead.source}</Badge>
      )}
    </div>
  </>
);

const AdminCRM = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [geladeira, setGeladeira] = useState<Lead[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('arquivado', false)
      .eq('geladeira', false)
      .order('created_at', { ascending: false });
    if (data) setLeads(data as unknown as Lead[]);

    const { data: gelData } = await supabase
      .from('leads')
      .select('*')
      .eq('geladeira', true)
      .eq('arquivado', false)
      .order('created_at', { ascending: false });
    if (gelData) setGeladeira(gelData as unknown as Lead[]);

    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateLead = async (id: string, updates: Record<string, any>) => {
    await (supabase.from('leads') as any).update(updates).eq('id', id);
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const draggableId = active.id as string;
    const destId = over.id as string;

    if (destId === 'geladeira') {
      await updateLead(draggableId, { geladeira: true });
      toast({ title: '❄️ Lead movido para a Geladeira' });
      const lead = leads.find(l => l.id === draggableId);
      setLeads(prev => prev.filter(l => l.id !== draggableId));
      if (lead) setGeladeira(prev => [{ ...lead, geladeira: true }, ...prev]);
      return;
    }

    if (destId === 'lixeira') {
      await updateLead(draggableId, { arquivado: true });
      toast({ title: '🗑️ Lead arquivado' });
      setLeads(prev => prev.filter(l => l.id !== draggableId));
      return;
    }

    await updateLead(draggableId, { status: destId });
    setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, status: destId } : l));
    toast({ title: `Lead movido para "${COLUMNS.find(c => c.id === destId)?.label}"` });
  };

  const restoreFromGeladeira = async (id: string) => {
    await updateLead(id, { geladeira: false });
    const lead = geladeira.find(l => l.id === id);
    if (lead) {
      setGeladeira(prev => prev.filter(l => l.id !== id));
      setLeads(prev => [{ ...lead, geladeira: false }, ...prev]);
    }
    toast({ title: 'Lead restaurado ao funil' });
  };

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>CRM — Funil de Vendas | Admin</title></Helmet>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">CRM — Funil de Vendas</h1>
            <p className="text-sm text-muted-foreground">{leads.length} leads ativos · {geladeira.length} na geladeira</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Snowflake className="h-4 w-4" />
                Geladeira ({geladeira.length})
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Snowflake className="h-5 w-5" /> Geladeira
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                {geladeira.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum lead na geladeira.</p>
                )}
                {geladeira.map(lead => (
                  <Card key={lead.id} className="p-3 space-y-2">
                    <p className="font-medium text-sm text-foreground">{lead.name}</p>
                    {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => restoreFromGeladeira(lead.id)}>
                      Restaurar ao funil
                    </Button>
                  </Card>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          {activeId && (
            <div className="flex gap-4 mb-2">
              <DroppableColumn
                id="geladeira"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 transition-colors border-border text-muted-foreground"
              >
                <Snowflake className="h-5 w-5" />
                <span className="text-sm font-medium">❄️ Geladeira</span>
              </DroppableColumn>
              <DroppableColumn
                id="lixeira"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 transition-colors border-border text-muted-foreground"
              >
                <Trash2 className="h-5 w-5" />
                <span className="text-sm font-medium">🗑️ Lixeira</span>
              </DroppableColumn>
            </div>
          )}

          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
            {COLUMNS.map(col => {
              const colLeads = leads.filter(l => (l.status || 'sem_atendimento') === col.id);
              return (
                <DroppableColumn
                  key={col.id}
                  id={col.id}
                  className={`flex-shrink-0 w-[280px] rounded-xl border border-border ${col.color} p-3 space-y-3 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-foreground">{col.label}</h3>
                    <Badge variant="secondary" className={`text-xs ${COLUMN_BADGE_COLORS[col.id] || ''}`}>
                      {colLeads.length}
                    </Badge>
                  </div>

                  {colLeads.map((lead) => (
                    <DraggableCard key={lead.id} lead={lead} />
                  ))}

                  {colLeads.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">Nenhum lead</p>
                  )}
                </DroppableColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeLead && (
              <div className="bg-card rounded-lg border border-border p-3 space-y-2 shadow-lg w-[260px]">
                <LeadCardContent lead={activeLead} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
};

export default AdminCRM;
