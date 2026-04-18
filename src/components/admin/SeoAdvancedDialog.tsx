import { useEffect, useRef, useState } from 'react';
import { Loader2, Save, Upload, X, Image as ImageIcon, Link as LinkIcon, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { processAndUploadGuiaImage } from '@/lib/guiaImageUpload';

export interface SeoAdvancedValues {
  customTitle: string;
  customDescription: string;
  ogImage: string;
  isIndexed: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  path: string;
  label: string;
  defaultTitle: string;
  defaultDescription: string;
  fallbackOgImage: string; // global fallback (SEO Geral / Guia)
  initial: SeoAdvancedValues;
  onSave: (values: SeoAdvancedValues) => Promise<void>;
}

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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setValues(initial); }, [open, initial]);

  const previewImage = values.ogImage || fallbackOgImage || '';
  const previewTitle = values.customTitle.trim() || defaultTitle || label;
  const previewDesc = values.customDescription.trim() || defaultDescription || '';

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
      await onSave(values);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const ogSource = values.ogImage
    ? { label: 'Customizada (esta rota)', color: 'bg-emerald-500' }
    : fallbackOgImage
      ? { label: 'Fallback global', color: 'bg-amber-500' }
      : { label: 'Sem imagem', color: 'bg-muted-foreground' };

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
            <TabsTrigger value="metadata">Metadados</TabsTrigger>
            <TabsTrigger value="preview">Preview Social</TabsTrigger>
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
                <strong>Hierarquia:</strong> 1º imagem desta rota → 2º imagem da entidade (capa do imóvel/local/post) → 3º fallback global (SEO Geral/Guia).
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">
              Prévia aproximada de como o link aparecerá ao ser compartilhado no WhatsApp / Facebook.
            </p>

            <div className="max-w-md mx-auto rounded-lg overflow-hidden border border-border bg-card shadow-sm">
              {previewImage ? (
                <img src={previewImage} alt="OG preview" className="w-full aspect-[1200/630] object-cover bg-muted" />
              ) : (
                <div className="w-full aspect-[1200/630] bg-muted flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              <div className="p-3 space-y-1 bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">{(typeof window !== 'undefined' ? window.location.host : 'site.com')}{path}</p>
                <p className="text-sm font-semibold leading-tight line-clamp-2">{previewTitle}</p>
                {previewDesc && <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{previewDesc}</p>}
              </div>
            </div>

            <div className="mt-4 text-[11px] text-muted-foreground space-y-1">
              <p><strong>Imagem usada:</strong> {values.ogImage ? 'customizada desta rota' : fallbackOgImage ? 'fallback global' : 'nenhuma — entidade poderá injetar a sua'}</p>
              <p className="text-muted-foreground/70">A imagem real exibida ao usuário pode ser substituída pela imagem de destaque da entidade (imóvel/post/local) caso esta rota não tenha customização.</p>
            </div>
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
