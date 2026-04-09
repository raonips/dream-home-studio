import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Upload, X, AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadToStorageWithProgress } from '@/lib/storageUpload';
import demoImage from '@/assets/watermark-demo.jpg';

const BUCKET = 'property-images';

interface WatermarkForm {
  watermark_url: string;
  watermark_position: string;
  watermark_opacity: number;
  watermark_scale: number;
}

interface Props {
  settingsId: string | null;
  initialValues: WatermarkForm;
}

const POSITIONS = [
  { value: 'center', label: 'Centralizado' },
  { value: 'bottom-right', label: 'Canto inferior direito' },
  { value: 'top-right', label: 'Canto superior direito' },
  { value: 'bottom-left', label: 'Canto inferior esquerdo' },
  { value: 'top-left', label: 'Canto superior esquerdo' },
];

const SCALES = [
  { value: '0.05', label: '5%' },
  { value: '0.1', label: '10%' },
  { value: '0.15', label: '15%' },
  { value: '0.2', label: '20%' },
  { value: '0.25', label: '25%' },
  { value: '0.3', label: '30%' },
  { value: '0.35', label: '35%' },
  { value: '0.4', label: '40%' },
  { value: '0.45', label: '45%' },
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100% (Original)' },
];

const WatermarkSettings = ({ settingsId, initialValues }: Props) => {
  const { toast } = useToast();
  const [form, setForm] = useState<WatermarkForm>(initialValues);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync with parent when initialValues change
  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  // Draw live preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.onload = () => {
      canvas.width = baseImg.naturalWidth;
      canvas.height = baseImg.naturalHeight;
      ctx.drawImage(baseImg, 0, 0);

      if (form.watermark_url) {
        const wmImg = new Image();
        wmImg.crossOrigin = 'anonymous';
        wmImg.onload = () => {
          const scale = form.watermark_scale || 0.5;
          const maxW = canvas.width * scale;
          const ratio = wmImg.naturalWidth / wmImg.naturalHeight;
          const wmW = Math.min(maxW, wmImg.naturalWidth);
          const wmH = wmW / ratio;
          const padding = Math.min(canvas.width, canvas.height) * 0.03;

          let x = 0, y = 0;
          switch (form.watermark_position) {
            case 'top-left': x = padding; y = padding; break;
            case 'top-right': x = canvas.width - wmW - padding; y = padding; break;
            case 'bottom-left': x = padding; y = canvas.height - wmH - padding; break;
            case 'bottom-right': x = canvas.width - wmW - padding; y = canvas.height - wmH - padding; break;
            case 'center': default: x = (canvas.width - wmW) / 2; y = (canvas.height - wmH) / 2; break;
          }

          ctx.globalAlpha = Math.max(0.05, Math.min(1, form.watermark_opacity));
          ctx.drawImage(wmImg, x, y, wmW, wmH);
          ctx.globalAlpha = 1;
        };
        wmImg.src = form.watermark_url;
      }
    };
    baseImg.src = demoImage;
  }, [form.watermark_url, form.watermark_position, form.watermark_opacity, form.watermark_scale]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Arquivo muito grande (máx. 2MB)' });
      return;
    }
    setUploading(true);
    try {
      const safePath = `site/watermark-${Date.now()}.${file.name.split('.').pop()?.toLowerCase() || 'png'}`;
      const result = await uploadToStorageWithProgress({
        bucket: BUCKET,
        path: safePath,
        file,
        onProgress: () => {},
      });
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(result.path);
      setForm(f => ({ ...f, watermark_url: data.publicUrl }));
      toast({ title: 'Logo de marca d\'água enviada!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: err.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    const { error } = await supabase
      .from('site_settings')
      .update({
        watermark_url: form.watermark_url,
        watermark_position: form.watermark_position,
        watermark_opacity: form.watermark_opacity,
        watermark_scale: form.watermark_scale,
      } as any)
      .eq('id', settingsId);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Configurações de marca d\'água salvas!' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50 border border-accent">
        <AlertTriangle className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-foreground">
          <p className="font-semibold mb-1">Atenção!</p>
          <p>A imagem recomendada é <strong>.PNG com fundo transparente</strong>. Após inserir a marca d'água, não é possível reverter o processo. A marca será inserida apenas nos <strong>novos uploads</strong> a partir deste momento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logo da Marca D'água</CardTitle>
              <CardDescription>Envie sua logo em PNG transparente (máx. 2MB).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {form.watermark_url ? (
                  <div className="relative">
                    <img src={form.watermark_url} alt="Watermark" className="h-14 max-w-[200px] object-contain rounded border border-border p-1 bg-muted" />
                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setForm(f => ({ ...f, watermark_url: '' }))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  {form.watermark_url ? 'Trocar logo' : 'Escolher arquivo'}
                </Button>
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/webp,image/svg+xml" className="hidden" onChange={handleUploadLogo} />
            </CardContent>
          </Card>

          {/* Position */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Posição</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={form.watermark_position} onValueChange={(v) => setForm(f => ({ ...f, watermark_position: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Opacity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transparência (Opacidade)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={form.watermark_opacity}
                  onChange={(e) => setForm(f => ({ ...f, watermark_opacity: parseFloat(e.target.value) }))}
                  className="flex-1 h-2 accent-primary cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground w-12 text-right">
                  {Math.round(form.watermark_opacity * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Menor = mais transparente, maior = mais visível.</p>
            </CardContent>
          </Card>

          {/* Scale */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tamanho da Imagem</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={String(form.watermark_scale)} onValueChange={(v) => setForm(f => ({ ...f, watermark_scale: parseFloat(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCALES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Preview em Tempo Real</Label>
          <div className="rounded-lg overflow-hidden border border-border bg-muted">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Esta é uma demonstração. A marca d'água será aplicada em todas as novas fotos enviadas.
          </p>
        </div>
      </div>

      <Button onClick={handleSave} size="lg" className="w-full gap-2" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar Configurações de Marca D'água
      </Button>
    </div>
  );
};

export default WatermarkSettings;
