import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadToStorageWithProgress } from '@/lib/storageUpload';

const TABLE = 'guia_site_settings';

const AdminGuiaSeoSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const ogFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);

  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState({
    site_title: '',
    site_description: '',
    site_keywords: '',
    og_image_url: '',
    head_scripts: '',
    body_scripts: '',
    favicon_url: '',
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
            site_title: d.site_title || '',
            site_description: d.site_description || '',
            site_keywords: d.site_keywords || '',
            og_image_url: d.og_image_url || '',
            head_scripts: d.head_scripts || '',
            body_scripts: d.body_scripts || '',
            favicon_url: d.favicon_url || '',
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
        site_title: form.site_title.trim(),
        site_description: form.site_description.trim(),
        site_keywords: form.site_keywords.trim(),
        og_image_url: form.og_image_url.trim(),
        head_scripts: form.head_scripts,
        body_scripts: form.body_scripts,
        favicon_url: form.favicon_url.trim(),
      } as any)
      .eq('id', settingsId);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'SEO do Guia salvo com sucesso!' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'og_image_url' | 'favicon_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Imagem muito grande (máx. 5MB)' });
      return;
    }
    setUploading(field);
    try {
      const safePath = `seo/guia-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`;
      const result = await uploadToStorageWithProgress({
        bucket: 'property-images',
        path: safePath,
        file,
        onProgress: () => {},
      });
      const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(result.path);
      setForm((f) => ({ ...f, [field]: urlData.publicUrl }));
      toast({ title: 'Imagem enviada!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: err.message });
    } finally {
      setUploading(null);
      if (field === 'og_image_url' && ogFileRef.current) ogFileRef.current.value = '';
      if (field === 'favicon_url' && faviconFileRef.current) faviconFileRef.current.value = '';
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
      <Helmet><title>SEO do Guia | Admin</title></Helmet>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">SEO do Guia Local</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os metadados das páginas do Guia (raiz do site). As páginas de imóveis possuem configuração separada.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metadados do Guia</CardTitle>
            <CardDescription>Essas informações aparecem no Google, WhatsApp e redes sociais para as páginas do Guia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Título do Site (Title Tag)</Label>
              <Input value={form.site_title} onChange={set('site_title')} placeholder="Barra do Jacuípe | Guia Local do Litoral Norte" maxLength={70} />
              <p className="text-xs text-muted-foreground">{form.site_title.length}/70 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea value={form.site_description} onChange={set('site_description')} placeholder="Descubra praias, restaurantes e passeios..." rows={3} maxLength={160} />
              <p className="text-xs text-muted-foreground">{form.site_description.length}/160 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label>Palavras-chave (Keywords)</Label>
              <Textarea value={form.site_keywords} onChange={set('site_keywords')} placeholder="barra do jacuípe, praias litoral norte, guia local" rows={2} />
              <p className="text-xs text-muted-foreground">Separadas por vírgula</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Imagem de Compartilhamento (OG Image)</CardTitle>
            <CardDescription>Imagem que aparece quando o Guia é compartilhado. Recomendado: 1200×630px.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.og_image_url ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={form.og_image_url} alt="OG Image Preview" className="w-full aspect-[1200/630] object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => setForm((f) => ({ ...f, og_image_url: '' }))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-[hsl(var(--guia-primary))]/50 transition-colors" onClick={() => ogFileRef.current?.click()}>
                <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Clique para enviar a imagem de compartilhamento</p>
              </div>
            )}
            <input ref={ogFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleImageUpload(e, 'og_image_url')} />
            {form.og_image_url && (
              <Button type="button" variant="outline" size="sm" onClick={() => ogFileRef.current?.click()} disabled={uploading === 'og_image_url'}>
                {uploading === 'og_image_url' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Trocar imagem
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Favicon</CardTitle>
            <CardDescription>Ícone na aba do navegador para o Guia. Recomendado: 32×32px, PNG ou ICO.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {form.favicon_url ? (
                <div className="relative">
                  <img src={form.favicon_url} alt="Favicon" className="w-16 h-16 object-contain rounded border border-border p-1" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setForm((f) => ({ ...f, favicon_url: '' }))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={() => faviconFileRef.current?.click()} disabled={uploading === 'favicon_url'}>
                {uploading === 'favicon_url' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {form.favicon_url ? 'Trocar favicon' : 'Enviar favicon'}
              </Button>
            </div>
            <input ref={faviconFileRef} type="file" accept="image/png,image/x-icon,image/svg+xml" className="hidden" onChange={(e) => handleImageUpload(e, 'favicon_url')} />
            <div className="space-y-2">
              <Label>Ou cole a URL do favicon</Label>
              <Input value={form.favicon_url} onChange={set('favicon_url')} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scripts Personalizados</CardTitle>
            <CardDescription>Scripts exclusivos para as páginas do Guia (analytics, pixels, etc.).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Scripts do Head</Label>
              <Textarea value={form.head_scripts} onChange={set('head_scripts')} placeholder={'<!-- Google tag (gtag.js) -->\n<script async src="..."></script>'} rows={5} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Scripts do Body</Label>
              <Textarea value={form.body_scripts} onChange={set('body_scripts')} placeholder={'<!-- Facebook Pixel -->\n<noscript>...</noscript>'} rows={5} className="font-mono text-xs" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} size="lg" className="w-full gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar SEO do Guia
        </Button>
      </div>
    </>
  );
};

export default AdminGuiaSeoSettings;
