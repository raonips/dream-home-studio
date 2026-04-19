import { useEffect, useRef, useState } from 'react';
import { Loader2, Save, Upload, X, Image as ImageIcon, Link as LinkIcon, Globe, Sparkles, Plus, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { processAndUploadGuiaImage } from '@/lib/guiaImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useEntityOgImage } from '@/hooks/useEntityOgImage';

export interface Sitelink {
  title: string;
  url: string;
}

export interface SeoAdvancedValues {
  customTitle: string;
  customDescription: string;
  ogImage: string;
  isIndexed: boolean;
  sitelinks: Sitelink[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  path: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
  fallbackOgImage: string;
  initial: SeoAdvancedValues;
  onSave: (values: SeoAdvancedValues) => Promise<void>;
}

const MAX_SITELINKS = 4;

const SeoAdvancedDialog = ({
  open, onOpenChange, path, label,
  defaultTitle, defaultDescription, fallbackOgImage,
  initial, onSave,
}: Props) => {
  const { toast } = useToast();
  const [values, setValues] = useState<SeoAdvancedValues>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Only re-seed local state when the dialog OPENS (or the target route changes).
  // Avoid depending on `initial` reference — parent re-renders create new object literals,
  // which would otherwise wipe out user edits / AI suggestions / uploaded URLs immediately.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) setValues({ ...initial, sitelinks: initial.sitelinks || [] }); }, [open, path]);

  // Level-2 fallback: cover image of the dynamic entity (property/local/post/etc.)
  const entityImage = useEntityOgImage(path);

  // Hierarchy: 1 override → 2 entity image → 3 global fallback
  const previewImage = values.ogImage || entityImage || fallbackOgImage || '';
  const previewTitle = values.customTitle.trim() || defaultTitle || label;
  const previewDesc = values.customDescription.trim() || defaultDescription || '';
  const host = typeof window !== 'undefined' ? window.location.host : 'site.com';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Imagem muito grande (máx. 5MB)' });
      return;
    }
    setUploading(true);
    setProgress(5);
    try {
      const url = await processAndUploadGuiaImage({
        file,
        bucket: 'property-images',
        folder: 'seo-overrides',
        oldUrl: values.ogImage || undefined,
        onProgress: setProgress,
      });
      setValues((v) => ({ ...v, ogImage: url }));
      toast({ title: 'Imagem enviada e otimizada' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: err.message });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleaned = (values.sitelinks || [])
        .map((s) => ({ title: (s.title || '').trim(), url: (s.url || '').trim() }))
        .filter((s) => s.title && s.url)
        .slice(0, MAX_SITELINKS);
      await onSave({ ...values, sitelinks: cleaned });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Sitelinks management ──
  const addSitelink = () => {
    setValues((v) => v.sitelinks.length >= MAX_SITELINKS ? v : ({ ...v, sitelinks: [...v.sitelinks, { title: '', url: '' }] }));
  };
  const updateSitelink = (i: number, field: 'title' | 'url', val: string) => {
    setValues((v) => ({ ...v, sitelinks: v.sitelinks.map((s, idx) => idx === i ? { ...s, [field]: val } : s) }));
  };
  const removeSitelink = (i: number) => {
    setValues((v) => ({ ...v, sitelinks: v.sitelinks.filter((_, idx) => idx !== i) }));
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-sitelinks', {
        body: {
          path,
          title: values.customTitle || defaultTitle,
          description: values.customDescription || defaultDescription,
          label,
        },
      });
      if (error) throw error;
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const list: Sitelink[] = (parsed?.sitelinks || []).slice(0, MAX_SITELINKS);
      if (!list.length) throw new Error('IA não retornou sugestões');
      setValues((v) => ({ ...v, sitelinks: list }));
      toast({ title: 'Sugestões geradas pela IA', description: `${list.length} sitelinks aplicados.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao sugerir', description: err?.message || 'Falha desconhecida' });
    } finally {
      setAiLoading(false);
    }
  };

  const ogSource = values.ogImage
    ? { label: 'Customizada (esta rota)', color: 'bg-emerald-500' }
    : fallbackOgImage
      ? { label: 'Fallback global', color: 'bg-amber-500' }
      : { label: 'Sem imagem', color: 'bg-muted-foreground' };

  // Build display URL like Google
  const displayUrl = `${host}${path === '/' ? '' : path}`.replace(/^https?:\/\//, '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            SEO Avançado
          </DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">{path}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="metadata" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metadata">Metadados & Sitelinks</TabsTrigger>
            <TabsTrigger value="preview">Previews</TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título SEO</Label>
              <Input
                value={values.customTitle}
                onChange={(e) => setValues((v) => ({ ...v, customTitle: e.target.value }))}
                placeholder={defaultTitle || 'Título...'}
                maxLength={70}
              />
              <p className="text-xs text-muted-foreground">{values.customTitle.length}/70</p>
            </div>

            <div className="space-y-2">
              <Label>Descrição SEO</Label>
              <Textarea
                value={values.customDescription}
                onChange={(e) => setValues((v) => ({ ...v, customDescription: e.target.value }))}
                placeholder={defaultDescription || 'Descrição...'}
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">{values.customDescription.length}/160</p>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Indexar no Google</Label>
                <Switch
                  checked={values.isIndexed}
                  onCheckedChange={(c) => setValues((v) => ({ ...v, isIndexed: c }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {values.isIndexed
                  ? 'Página será incluída no sitemap e indexada.'
                  : 'Página será excluída do sitemap e marcada como noindex.'}
              </p>
            </div>

            {/* ── Sitelinks ── */}
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Label className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Sitelinks Sugeridos (Schema)
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Até {MAX_SITELINKS} sub-links. Injetados como JSON-LD <code className="font-mono">SiteNavigationElement</code>.
                  </p>
                </div>
                <Button
                  type="button" size="sm" variant="outline"
                  onClick={handleAiSuggest} disabled={aiLoading}
                  className="gap-1.5"
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                  Sugerir com IA
                </Button>
              </div>

              <div className="space-y-2">
                {values.sitelinks.length === 0 && (
                  <p className="text-xs text-muted-foreground italic px-1">Nenhum sitelink. Adicione manualmente ou use a IA.</p>
                )}
                {values.sitelinks.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      value={s.title}
                      onChange={(e) => updateSitelink(i, 'title', e.target.value)}
                      placeholder="Título (ex: Vendas)"
                      className="flex-1 h-8 text-sm"
                      maxLength={40}
                    />
                    <Input
                      value={s.url}
                      onChange={(e) => updateSitelink(i, 'url', e.target.value)}
                      placeholder="/url-relativa"
                      className="flex-1 h-8 text-sm font-mono text-xs"
                    />
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeSitelink(i)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              {values.sitelinks.length < MAX_SITELINKS && (
                <Button type="button" size="sm" variant="ghost" onClick={addSitelink} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Adicionar sitelink ({values.sitelinks.length}/{MAX_SITELINKS})
                </Button>
              )}
            </div>

            {/* ── OG Image ── */}
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  OG Image (Compartilhamento)
                </Label>
                <span className={`text-[10px] text-white px-2 py-0.5 rounded ${ogSource.color}`}>
                  {ogSource.label}
                </span>
              </div>

              {values.ogImage ? (
                <div className="relative rounded-md overflow-hidden border border-border">
                  <img src={values.ogImage} alt="OG preview" className="w-full aspect-[1200/630] object-cover" />
                  <Button
                    type="button" size="icon" variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => setValues((v) => ({ ...v, ogImage: '' }))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Clique para enviar imagem (1200×630)</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Convertida para WebP</p>
                </div>
              )}

              {uploading && <Progress value={progress} className="h-1.5" />}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                  {values.ogImage ? 'Trocar' : 'Enviar'}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5"><LinkIcon className="h-3 w-3" /> Ou cole a URL</Label>
                <Input
                  value={values.ogImage}
                  onChange={(e) => setValues((v) => ({ ...v, ogImage: e.target.value }))}
                  placeholder="https://..."
                  className="text-xs font-mono"
                />
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <strong>Hierarquia:</strong> 1º imagem desta rota → 2º imagem da entidade → 3º fallback global.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Previews dos resultados em buscadores e redes sociais.
            </p>

            <Accordion type="single" collapsible defaultValue="google" className="w-full">
              {/* ── Google Preview ── */}
              <AccordionItem value="google">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2"><Search className="h-4 w-4 text-blue-600" /> Preview do Google {values.sitelinks.length > 0 && <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">com {values.sitelinks.length} sitelinks</span>}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="max-w-2xl rounded-lg border border-border bg-background p-4 space-y-1 font-sans">
                    <p className="text-[12px] text-muted-foreground truncate">{displayUrl}</p>
                    <p className="text-[20px] leading-tight text-blue-700 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
                      {previewTitle}
                    </p>
                    {previewDesc && (
                      <p className="text-[13px] text-foreground/80 leading-snug line-clamp-2">{previewDesc}</p>
                    )}
                    {values.sitelinks.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 pt-2">
                        {values.sitelinks.map((s, i) => (
                          <div key={i} className="space-y-0.5 min-w-0">
                            <p className="text-[14px] text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">{s.title || '—'}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{host}{s.url}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ── Social Preview ── */}
              <AccordionItem value="social">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-emerald-600" /> Preview Social (WhatsApp / Facebook)</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="max-w-md rounded-lg overflow-hidden border border-border bg-card shadow-sm">
                    {previewImage ? (
                      <img src={previewImage} alt="OG preview" className="w-full aspect-[1200/630] object-cover bg-muted" />
                    ) : (
                      <div className="w-full aspect-[1200/630] bg-muted flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                    <div className="p-3 space-y-1 bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{displayUrl}</p>
                      <p className="text-sm font-semibold leading-tight line-clamp-2">{previewTitle}</p>
                      {previewDesc && <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{previewDesc}</p>}
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-muted-foreground space-y-1">
                    <p><strong>Imagem:</strong> {values.ogImage ? 'customizada desta rota' : fallbackOgImage ? 'fallback global' : 'nenhuma — entidade poderá injetar a sua'}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SeoAdvancedDialog;
