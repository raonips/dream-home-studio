import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Eye, LayoutTemplate, Type, MousePointerClick, Layers, AlignCenter, PanelLeft, Code2, CheckCircle2 } from 'lucide-react';
import type { AdTemplateRow } from '@/pages/admin/AdminAdTemplates';
import { useState } from 'react';

const CATEGORIA_LABELS: Record<string, string> = {
  condominio: 'Condomínio',
  mercado: 'Mercado',
  padaria: 'Padaria',
  restaurante: 'Restaurante',
  hospedagem: 'Hospedagem',
  saude: 'Saúde',
  gas: 'Gás',
  limpeza: 'Materiais de Limpeza',
  farmacia: 'Farmácia',
  utilidade: 'Utilidade',
};

const OVERLAY_LABELS: Record<string, string> = {
  oceanic: 'Oceânico',
  dark: 'Escuro',
  warm: 'Quente',
};

const OVERLAY_COLORS: Record<string, string> = {
  oceanic: 'from-blue-900/80 to-blue-800/60',
  dark: 'from-gray-900/80 to-gray-800/60',
  warm: 'from-amber-900/80 to-amber-800/60',
};

export type LayoutModel = 'full_banner' | 'split' | 'html_custom';

export const LAYOUT_LABELS: Record<LayoutModel, string> = {
  full_banner: 'Full Banner',
  split: 'Split',
  html_custom: 'HTML Livre',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AdTemplateRow[];
  onEdit: (item: AdTemplateRow) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, current: boolean) => void;
  onCreateNew: (layout?: LayoutModel) => void;
}

const AdTemplateGalleryDialog = ({ open, onOpenChange, items, onEdit, onDelete, onToggle, onCreateNew }: Props) => {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [tab, setTab] = useState<'layouts' | 'existing'>('layouts');
  const previewItem = items.find(i => i.id === previewId);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setPreviewId(null); setTab('layouts'); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            Modelos de Layout
          </DialogTitle>
          <DialogDescription>
            Escolha um layout para criar uma nova publicidade ou visualize as publicidades existentes.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={tab === 'layouts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => { setTab('layouts'); setPreviewId(null); }}
          >
            <LayoutTemplate className="h-4 w-4 mr-1.5" /> Layouts Disponíveis
          </Button>
          <Button
            variant={tab === 'existing' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('existing')}
          >
            <Layers className="h-4 w-4 mr-1.5" /> Publicidades Criadas ({items.length})
          </Button>
        </div>

        {tab === 'layouts' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Model A - Full Banner */}
            <Card className="group cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/50" onClick={() => onCreateNew('full_banner')}>
              <CardContent className="p-4 space-y-3 text-center">
                <div className="relative mx-auto w-full aspect-[16/9] rounded-md bg-gradient-to-r from-blue-900/80 to-blue-700/60 flex items-center justify-center overflow-hidden">
                  <div className="space-y-1">
                    <div className="w-20 h-1.5 bg-white/70 rounded mx-auto" />
                    <div className="w-14 h-1 bg-white/40 rounded mx-auto" />
                    <div className="w-10 h-2 bg-white/30 rounded-full mx-auto mt-2" />
                  </div>
                  <AlignCenter className="absolute top-2 right-2 h-4 w-4 text-white/40" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Modelo A — Full Banner</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Imagem de fundo total com texto centralizado</p>
                </div>
                <Button size="sm" variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Usar este modelo
                </Button>
              </CardContent>
            </Card>

            {/* Model B - Split */}
            <Card className="group cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/50" onClick={() => onCreateNew('split')}>
              <CardContent className="p-4 space-y-3 text-center">
                <div className="relative mx-auto w-full aspect-[16/9] rounded-md overflow-hidden flex">
                  <div className="w-1/2 bg-muted flex flex-col items-start justify-center p-2 gap-1">
                    <div className="w-12 h-1.5 bg-foreground/50 rounded" />
                    <div className="w-9 h-1 bg-foreground/30 rounded" />
                    <div className="w-7 h-2 bg-primary/40 rounded-full mt-1" />
                  </div>
                  <div className="w-1/2 bg-gradient-to-br from-blue-800/60 to-blue-600/40" />
                  <PanelLeft className="absolute top-2 right-2 h-4 w-4 text-white/40" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Modelo B — Split</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Texto de um lado, imagem do outro</p>
                </div>
                <Button size="sm" variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Usar este modelo
                </Button>
              </CardContent>
            </Card>

            {/* Model C - HTML Custom */}
            <Card className="group cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/50" onClick={() => onCreateNew('html_custom')}>
              <CardContent className="p-4 space-y-3 text-center">
                <div className="relative mx-auto w-full aspect-[16/9] rounded-md bg-muted/80 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <Code2 className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Modelo C — HTML Livre</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Cole seu próprio código HTML/CSS</p>
                </div>
                <Button size="sm" variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Usar este modelo
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'existing' && (
          <>
            {/* Preview panel */}
            {previewItem && (
              <Card className="border-primary/30 bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Pré-visualização: {previewItem.title}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewId(null)}>Fechar</Button>
                  </div>

                  {/* Mini banner preview */}
                  <div className={`relative rounded-lg overflow-hidden bg-gradient-to-r ${OVERLAY_COLORS[previewItem.overlay_style] || OVERLAY_COLORS.oceanic} p-6`}>
                    <div className="relative z-10 text-center space-y-2">
                      <p className="text-white/90 font-bold text-lg leading-tight">
                        {previewItem.heading.replace(/\{nome\}/g, '[Nome do Local]')}
                      </p>
                      {previewItem.subtitle && (
                        <p className="text-white/70 text-sm">{previewItem.subtitle.replace(/\{nome\}/g, '[Nome do Local]')}</p>
                      )}
                      <div className="pt-2">
                        <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/30">
                          {previewItem.button_text}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Categoria: <strong className="text-foreground">{CATEGORIA_LABELS[previewItem.target_category] || previewItem.target_category}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Type className="h-3.5 w-3.5" />
                      <span>Overlay: <strong className="text-foreground">{OVERLAY_LABELS[previewItem.overlay_style] || previewItem.overlay_style}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MousePointerClick className="h-3.5 w-3.5" />
                      <span>Botão: <strong className="text-foreground">{previewItem.button_text}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LayoutTemplate className="h-3.5 w-3.5" />
                      <span>Layout: <strong className="text-foreground">{LAYOUT_LABELS[(previewItem as any).layout_model as LayoutModel] || 'Full Banner'}</strong></span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => { setPreviewId(null); onEdit(previewItem); }}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => { setPreviewId(null); onDelete(previewItem.id); }}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <LayoutTemplate className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Nenhuma publicidade criada ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(t => (
                  <Card
                    key={t.id}
                    className={`transition-all hover:shadow-md ${previewId === t.id ? 'ring-2 ring-primary' : ''} ${!t.is_active ? 'opacity-60' : ''}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{t.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{t.heading}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {CATEGORIA_LABELS[t.target_category] || t.target_category}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {OVERLAY_LABELS[t.overlay_style] || t.overlay_style}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {LAYOUT_LABELS[(t as any).layout_model as LayoutModel] || 'Full Banner'}
                          </Badge>
                        </div>
                        <Switch
                          checked={t.is_active}
                          onCheckedChange={() => onToggle(t.id, t.is_active)}
                        />
                      </div>

                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setPreviewId(previewId === t.id ? null : t.id)}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onEdit(t)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => onDelete(t.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <Button variant="outline" className="w-full" onClick={() => setTab('layouts')}>
                <Plus className="h-4 w-4 mr-2" /> Criar Nova Publicidade
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdTemplateGalleryDialog;
