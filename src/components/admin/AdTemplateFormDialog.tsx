import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlignCenter, PanelLeft, Code2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AdTemplateRow } from '@/pages/admin/AdminAdTemplates';
import type { LayoutModel } from '@/components/admin/AdTemplateGalleryDialog';
import { LAYOUT_LABELS } from '@/components/admin/AdTemplateGalleryDialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AdTemplateRow | null;
  onSuccess: () => void;
  initialLayout?: LayoutModel;
}

const CATEGORY_OPTIONS = [
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

const OVERLAY_OPTIONS = [
  { value: 'oceanic', label: 'Oceânico (azul escuro)' },
  { value: 'dark', label: 'Escuro (preto)' },
  { value: 'warm', label: 'Quente (marrom dourado)' },
];

const LAYOUT_ICON: Record<LayoutModel, React.ReactNode> = {
  full_banner: <AlignCenter className="h-4 w-4" />,
  split: <PanelLeft className="h-4 w-4" />,
  html_custom: <Code2 className="h-4 w-4" />,
};

const AdTemplateFormDialog = ({ open, onOpenChange, editing, onSuccess, initialLayout }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    heading: '',
    subtitle: '',
    button_text: 'VER IMÓVEIS DISPONÍVEIS',
    overlay_style: 'oceanic',
    target_category: 'condominio',
    is_active: true,
    layout_model: 'full_banner' as LayoutModel,
    custom_html: '',
  });

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        heading: editing.heading,
        subtitle: editing.subtitle || '',
        button_text: editing.button_text,
        overlay_style: editing.overlay_style,
        target_category: editing.target_category,
        is_active: editing.is_active,
        layout_model: ((editing as any).layout_model as LayoutModel) || 'full_banner',
        custom_html: (editing as any).custom_html || '',
      });
    } else {
      setForm({
        title: '', heading: '', subtitle: '',
        button_text: 'VER IMÓVEIS DISPONÍVEIS',
        overlay_style: 'oceanic',
        target_category: 'condominio',
        is_active: true,
        layout_model: initialLayout || 'full_banner',
        custom_html: '',
      });
    }
  }, [editing, open, initialLayout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast({ variant: 'destructive', title: 'Informe o nome da publicidade' }); return; }
    if (form.layout_model !== 'html_custom' && !form.heading.trim()) { toast({ variant: 'destructive', title: 'Informe o título do banner' }); return; }
    if (form.layout_model === 'html_custom' && !form.custom_html.trim()) { toast({ variant: 'destructive', title: 'Informe o código HTML' }); return; }

    setLoading(true);
    const payload = {
      title: form.title.trim(),
      heading: form.heading.trim(),
      subtitle: form.subtitle.trim(),
      button_text: form.button_text.trim() || 'VER IMÓVEIS DISPONÍVEIS',
      overlay_style: form.overlay_style,
      target_category: form.target_category,
      is_active: form.is_active,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('ad_templates').update(payload as any).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('ad_templates').insert(payload as any));
    }

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: editing ? 'Publicidade atualizada' : 'Publicidade criada' });
      onOpenChange(false);
      onSuccess();
    }
    setLoading(false);
  };

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const isHtmlCustom = form.layout_model === 'html_custom';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Publicidade' : 'Nova Publicidade'}</DialogTitle>
          <DialogDescription>
            Defina o conteúdo do banner. Cada local individual terá sua própria imagem e URL de destino.
          </DialogDescription>
        </DialogHeader>

        {/* Layout indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
          {LAYOUT_ICON[form.layout_model]}
          <span className="text-sm font-medium text-foreground">Layout: {LAYOUT_LABELS[form.layout_model]}</span>
          <Badge variant="outline" className="ml-auto text-[10px]">
            {form.layout_model === 'full_banner' ? 'Texto no Centro' : form.layout_model === 'split' ? 'Texto na Lateral' : 'Código Livre'}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Nome Interno</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Promoção Verão Condomínios" maxLength={200} required />
          </div>

          {!isHtmlCustom && (
            <>
              <div className="space-y-2">
                <Label>Título Principal do Banner</Label>
                <Textarea value={form.heading} onChange={e => set('heading', e.target.value)} placeholder='Ex: As melhores casas estão aqui no {nome}' rows={2} />
                <p className="text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">{'{nome}'}</code> para inserir o nome do local automaticamente.</p>
              </div>

              <div className="space-y-2">
                <Label>Subtítulo (opcional)</Label>
                <Input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Ex: Localização privilegiada em Barra do Jacuípe" />
              </div>

              <div className="space-y-2">
                <Label>Texto do Botão</Label>
                <Input value={form.button_text} onChange={e => set('button_text', e.target.value)} placeholder="VER IMÓVEIS DISPONÍVEIS" />
              </div>

              <div className="space-y-2">
                <Label>Estilo do Overlay</Label>
                <Select value={form.overlay_style} onValueChange={v => set('overlay_style', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OVERLAY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {isHtmlCustom && (
            <div className="space-y-2">
              <Label>Código HTML</Label>
              <Textarea
                value={form.custom_html}
                onChange={e => set('custom_html', e.target.value)}
                placeholder="<div style='padding:2rem;text-align:center'>...</div>"
                rows={8}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">{'{nome}'}</code> como variável. O HTML será renderizado dentro do banner.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Categoria Alvo</Label>
            <Select value={form.target_category} onValueChange={v => set('target_category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">Publicidade Ativa</p>
              <p className="text-xs text-muted-foreground">Desative para ocultar todos os banners desta categoria</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={c => set('is_active', c)} />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Salvar Publicidade' : 'Criar Publicidade'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdTemplateFormDialog;
