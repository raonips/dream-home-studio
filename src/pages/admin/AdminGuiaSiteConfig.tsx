import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2, Save, Upload, X, Image as ImageIcon, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { removeStorageFiles } from '@/lib/storageCleanup';
import { processAndUploadGuiaImage } from '@/lib/guiaImageUpload';
import imageCompression from 'browser-image-compression';
import { createSafeStoragePath, uploadToStorageWithProgress } from '@/lib/storageUpload';

const WatermarkSettings = lazy(() => import('@/components/admin/WatermarkSettings'));

const BUCKET = 'property-images';
const TABLE = 'guia_site_settings';

const AdminGuiaSiteConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const logoRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState({
    logo_url: '',
    hero_image_url: '',
    hero_bg_desktop: '',
    hero_bg_mobile: '',
    hero_title: '',
    hero_subtitle: '',
    map_provider: 'leaflet',
    google_maps_api_key: '',
    whatsapp_number: '',
    instagram_url: '',
  });
  const [watermarkForm, setWatermarkForm] = useState({
    watermark_url: '',
    watermark_position: 'center',
    watermark_opacity: 0.3,
    watermark_scale: 0.5,
  });

  useEffect(() => {
    supabase
      .from(TABLE)
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setSettingsId(d.id);
          setForm({
            logo_url: d.logo_url || '',
            hero_image_url: d.hero_image_url || '',
            hero_bg_desktop: d.hero_bg_desktop || '',
            hero_bg_mobile: d.hero_bg_mobile || '',
            hero_title: d.hero_title || '',
            hero_subtitle: d.hero_subtitle || '',
            map_provider: d.map_provider || 'leaflet',
            google_maps_api_key: d.google_maps_api_key || '',
            whatsapp_number: d.whatsapp_number || '',
            instagram_url: d.instagram_url || '',
          });
          setWatermarkForm({
            watermark_url: d.watermark_url || '',
            watermark_position: d.watermark_position || 'center',
            watermark_opacity: Number(d.watermark_opacity) || 0.3,
            watermark_scale: Number(d.watermark_scale) || 0.5,
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    const { error } = await supabase
      .from(TABLE)
      .update({
        logo_url: form.logo_url.trim(),
        hero_image_url: form.hero_image_url.trim(),
        hero_bg_desktop: form.hero_bg_desktop.trim(),
        hero_bg_mobile: form.hero_bg_mobile.trim(),
        hero_title: form.hero_title.trim(),
        hero_subtitle: form.hero_subtitle.trim(),
        map_provider: form.map_provider,
        google_maps_api_key: form.google_maps_api_key.trim(),
        whatsapp_number: form.whatsapp_number.trim(),
        instagram_url: form.instagram_url.trim(),
      } as any)
      .eq('id', settingsId);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Configurações do Guia salvas!' });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Imagem muito grande (máx. 10MB)' });
      return;
    }
    setUploading('logo_url');
    setUploadProgress(5);
    try {
      const publicUrl = await processAndUploadGuiaImage({
        file,
        bucket: BUCKET,
        folder: 'site',
        oldUrl: form.logo_url || undefined,
        onProgress: setUploadProgress,
      });
      setForm((f) => ({ ...f, logo_url: publicUrl }));
      toast({ title: 'Logo otimizada e enviada!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: err.message });
    } finally {
      setUploading(null);
      setUploadProgress(0);
      if (logoRef.current) logoRef.current.value = '';
    }
  };

  const handleHeroBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Imagem muito grande (máx. 10MB)' });
      return;
    }
    setUploading('hero_image_url');
    setUploadProgress(5);
    try {
      // Delete old files
      const oldUrls = [form.hero_bg_desktop, form.hero_bg_mobile, form.hero_image_url].filter(Boolean);
      if (oldUrls.length > 0) {
        await removeStorageFiles(oldUrls);
      }

      setUploadProgress(15);

      // Compress to WebP — desktop (1920px) + mobile (800px)
      const [desktopBlob, mobileBlob] = await Promise.all([
        imageCompression(file, {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1920,
          fileType: 'image/webp',
          useWebWorker: true,
          initialQuality: 0.8,
        }),
        imageCompression(file, {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 800,
          fileType: 'image/webp',
          useWebWorker: true,
          initialQuality: 0.8,
        }),
      ]);

      setUploadProgress(50);

      const baseName = file.name.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-');
      const ts = Date.now();

      const files = [
        { blob: desktopBlob, suffix: 'desktop' },
        { blob: mobileBlob, suffix: 'mobile' },
      ].map(({ blob, suffix }) => {
        const f = new File([blob], `guia-${ts}-${baseName}-${suffix}.webp`, { type: 'image/webp' });
        const path = createSafeStoragePath({ folder: 'site', file: f });
        return { file: f, path };
      });

      await Promise.all(
        files.map(({ file: f, path }) =>
          uploadToStorageWithProgress({ bucket: BUCKET, path, file: f, onProgress: () => {} })
        )
      );

      setUploadProgress(90);

      const urls = files.map(({ path }) =>
        supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      );

      setForm((f) => ({
        ...f,
        hero_image_url: urls[0],
        hero_bg_desktop: urls[0],
        hero_bg_mobile: urls[1],
      }));
      toast({ title: 'Banner otimizado e enviado! (Desktop + Mobile WebP)' });
    } catch (err: any) {
      console.error('[HeroBanner] Upload failed:', err);
      toast({ variant: 'destructive', title: 'Erro no upload do banner', description: err?.message || 'Erro desconhecido' });
    } finally {
      setUploading(null);
      setUploadProgress(0);
      if (heroRef.current) heroRef.current.value = '';
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--guia-primary))]" />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Configurações do Guia | Admin</title></Helmet>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Configurações do Guia Local</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie a identidade visual, conteúdo da Home do Guia (/) e proteção de imagens.
          </p>
          <p className="text-xs text-[hsl(var(--guia-primary))] font-medium mt-1">
            Estas configurações afetam apenas a raiz do site (/) e as páginas do Guia Local.
          </p>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="watermark">Marca D'água</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6 mt-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logo do Guia</CardTitle>
                <CardDescription>Exibida nas páginas do Guia Local. Recomendado: PNG transparente, máx. 250×80px. Convertida para WebP.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {form.logo_url ? (
                    <div className="relative">
                      <img src={form.logo_url} alt="Logo Guia" className="h-14 max-w-[200px] object-contain rounded border border-border p-1 bg-background" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => {
                        if (form.logo_url) removeStorageFiles([form.logo_url]).catch(() => {});
                        setForm((f) => ({ ...f, logo_url: '' }));
                      }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploading === 'logo_url'}>
                    {uploading === 'logo_url' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploading === 'logo_url' ? 'Otimizando e enviando...' : form.logo_url ? 'Trocar logo' : 'Enviar logo'}
                  </Button>
                </div>
                {uploading === 'logo_url' && <Progress value={uploadProgress} className="h-1.5" />}
                <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Banner Principal (Hero)</CardTitle>
                <CardDescription>
                  Imagem de fundo da seção principal da Home do Guia. Recomendado: 1920×1080px.
                  <br />
                  <span className="text-xs font-medium text-[hsl(var(--guia-primary))]">O sistema gera automaticamente versões Desktop e Mobile em WebP otimizado.</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.hero_bg_desktop || form.hero_image_url ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={form.hero_bg_desktop || form.hero_image_url} alt="Hero Preview" className="w-full aspect-video object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => {
                        const oldUrls = [form.hero_bg_desktop, form.hero_bg_mobile, form.hero_image_url].filter(Boolean);
                        removeStorageFiles(oldUrls).catch(() => {});
                        setForm((f) => ({ ...f, hero_image_url: '', hero_bg_desktop: '', hero_bg_mobile: '' }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {form.hero_bg_mobile && (
                      <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-foreground">
                        ✅ Versão Mobile gerada
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-[hsl(var(--guia-primary))]/50 transition-colors" onClick={() => heroRef.current?.click()}>
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Clique para enviar o banner da Home do Guia</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG ou PNG, máx. 10MB — será convertido para WebP</p>
                  </div>
                )}
                {uploading === 'hero_image_url' && <Progress value={uploadProgress} className="h-1.5" />}
                <input ref={heroRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleHeroBannerUpload} />
                {(form.hero_bg_desktop || form.hero_image_url) && (
                  <Button type="button" variant="outline" size="sm" onClick={() => heroRef.current?.click()} disabled={uploading === 'hero_image_url'}>
                    {uploading === 'hero_image_url' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploading === 'hero_image_url' ? 'Otimizando e enviando...' : 'Trocar banner'}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Textos do Hero</CardTitle>
                <CardDescription>Título e subtítulo exibidos sobre o banner principal do Guia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título Principal (H1)</Label>
                  <Input value={form.hero_title} onChange={set('hero_title')} placeholder="Guia Local de Barra do Jacuípe" />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input value={form.hero_subtitle} onChange={set('hero_subtitle')} placeholder="Praias, restaurantes, passeios e tudo sobre o Litoral Norte baiano." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Redes Sociais & WhatsApp</CardTitle>
                <CardDescription>Número do WhatsApp e link do Instagram exibidos nas páginas do Guia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>WhatsApp (ex: 5571991089039)</Label>
                  <Input value={form.whatsapp_number} onChange={set('whatsapp_number')} placeholder="5571991089039" />
                </div>
                <div className="space-y-2">
                  <Label>Link do Instagram</Label>
                  <Input value={form.instagram_url} onChange={set('instagram_url')} placeholder="https://instagram.com/seuusuario" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Map className="h-5 w-5" /> Provedor de Mapa</CardTitle>
                <CardDescription>Escolha qual serviço de mapa será usado nas páginas do Guia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Provedor Padrão</Label>
                  <Select value={form.map_provider} onValueChange={(v) => setForm((f) => ({ ...f, map_provider: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leaflet">Leaflet / OpenStreetMap (gratuito)</SelectItem>
                      <SelectItem value="google">Google Maps (requer API Key)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.map_provider === 'google' && (
                  <div className="space-y-2">
                    <Label>Google Maps API Key</Label>
                    <Input
                      value={form.google_maps_api_key}
                      onChange={set('google_maps_api_key')}
                      placeholder="AIzaSy..."
                      type="password"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={handleSave} size="lg" className="w-full gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Configurações do Guia
            </Button>
          </TabsContent>

          <TabsContent value="watermark" className="mt-6">
            <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--guia-primary))]" /></div>}>
              <WatermarkSettings settingsId={settingsId} initialValues={watermarkForm} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AdminGuiaSiteConfig;
