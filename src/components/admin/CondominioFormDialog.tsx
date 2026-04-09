import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Loader2, FileText, Settings, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageGalleryUpload from '@/components/admin/ImageGalleryUpload';
import LocationPicker from '@/components/admin/LocationPicker';
import CreatableCondominioTagSelect from '@/components/admin/CreatableCondominioTagSelect';
import { compressAndUploadCover } from '@/lib/imageCompression';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { CondominioRow } from '@/pages/admin/AdminCondominios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CondominioRow | null;
  onSuccess: () => void;
}

const CondominioFormDialog = ({ open, onOpenChange, editing, onSuccess }: Props) => {
  const { toast } = useToast();
  const siteSettings = useSiteSettings();
  const [loading, setLoading] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [condominioTags, setCondominioTags] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '', slug: '', description: '',
    location_filter: '',
    seo_title: '', seo_description: '',
    latitude: '', longitude: '',
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name, slug: editing.slug, description: editing.description,
        location_filter: editing.location_filter,
        seo_title: editing.seo_title || '',
        seo_description: editing.seo_description || '',
        latitude: String((editing as any).latitude || ''),
        longitude: String((editing as any).longitude || ''),
      });
      const editImages: string[] = [];
      if (editing.hero_image) editImages.push(editing.hero_image);
      if (editing.images) {
        for (const img of editing.images) {
          if (img && !editImages.includes(img)) editImages.push(img);
        }
      }
      setImages(editImages);
      setCondominioTags((editing as any).condominio_tags || []);
    } else {
      setForm({ name: '', slug: '', description: '', location_filter: '', seo_title: '', seo_description: '', latitude: '', longitude: '' });
      setImages([]);
      setCondominioTags([]);
    }
  }, [editing, open]);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    if (!name || name.length < 3) {
      toast({ variant: 'destructive', title: 'O nome deve ter pelo menos 3 caracteres' });
      return;
    }
    if (name.length > 200) {
      toast({ variant: 'destructive', title: 'O nome deve ter no máximo 200 caracteres' });
      return;
    }
    if (form.description.trim().length > 5000) {
      toast({ variant: 'destructive', title: 'A descrição deve ter no máximo 5000 caracteres' });
      return;
    }

    setLoading(true);

    // Generate thumbnail for the cover image if changed
    let thumbnailUrl = (editing as any)?.thumbnail_url || '';
    const coverUrl = images[0] || '';
    const previousCover = editing ? (editing.hero_image || '') : '';
    const coverChanged = coverUrl && coverUrl !== previousCover;

    if (coverChanged) {
      try {
        const resp = await fetch(coverUrl);
        const blob = await resp.blob();
        const coverFile = new File([blob], 'cover.jpg', { type: blob.type || 'image/jpeg' });
        const result = await compressAndUploadCover(coverFile, 'condominios', siteSettings.watermark_url ? {
          watermark_url: siteSettings.watermark_url,
          watermark_position: siteSettings.watermark_position,
          watermark_opacity: siteSettings.watermark_opacity,
          watermark_scale: siteSettings.watermark_scale,
        } : undefined);
        thumbnailUrl = result.thumbnailUrl;
      } catch (err) {
        console.warn('[CondominioForm] Thumbnail generation failed, using original', err);
      }
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || generateSlug(form.name),
      description: form.description.trim(),
      hero_image: coverUrl,
      images: images,
      featured_image: coverUrl,
      infrastructure: [],
      location_filter: form.location_filter.trim(),
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      latitude: parseFloat(form.latitude) || null,
      longitude: parseFloat(form.longitude) || null,
      thumbnail_url: thumbnailUrl,
      condominio_tags: condominioTags,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('condominios').update(payload as any).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('condominios').insert(payload as any));
    }

    setLoading(false);
    if (error) {
      console.error('[CondominioForm] Save error', error);
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      const hasImages = images.length > 0;
      toast({
        title: editing ? 'Condomínio atualizado' : 'Condomínio criado',
        description: !hasImages ? 'Salvo sem fotos. Edite para adicionar imagens depois.' : undefined,
      });
      onOpenChange(false);
      onSuccess();
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Condomínio' : 'Adicionar Condomínio'}</DialogTitle>
          <DialogDescription>Preencha os dados do condomínio. Fotos são opcionais no primeiro cadastro.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dados Principais
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                SEO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: editing ? f.slug : generateSlug(name) }));
                }} required maxLength={200} />
                <p className="text-xs text-muted-foreground">{form.name.length}/200 caracteres</p>
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <Input value={form.slug} onChange={set('slug')} placeholder="parque-das-arvores" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <RichTextEditor
                  value={form.description}
                  onChange={(val) => setForm((f) => ({ ...f, description: val }))}
                  placeholder="Descreva o condomínio com detalhes..."
                />
              </div>
              {/* Características do Condomínio */}
              <div className="space-y-2">
                <Label>Filtro de Localização</Label>
                <Input placeholder="Parque das Árvores" value={form.location_filter} onChange={set('location_filter')} />
              </div>

              <div className="space-y-2">
                <Label>Fotos (a primeira será a capa e imagem de compartilhamento)</Label>
                <p className="text-xs text-muted-foreground">A 1ª foto será usada como imagem de destaque no WhatsApp e redes sociais (Open Graph).</p>
                <ImageGalleryUpload images={images} onChange={setImages} folder="condominios" />
              </div>

              {/* Características do Condomínio */}
              <div className="space-y-2">
                <Label>Características do Condomínio</Label>
                <CreatableCondominioTagSelect value={condominioTags} onChange={setCondominioTags} />
                <p className="text-xs text-muted-foreground">Digite, selecione ou cole tags separadas por vírgula.</p>
              </div>

              {/* Geolocation */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onLatChange={(v) => setForm((f) => ({ ...f, latitude: v }))}
                  onLngChange={(v) => setForm((f) => ({ ...f, longitude: v }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="rounded-lg bg-muted p-4 mb-4">
                <p className="text-sm text-muted-foreground">
                  Configure os campos abaixo para otimizar a página nos mecanismos de busca.
                  Se deixados em branco, serão usados o Nome e a Descrição automaticamente.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
                disabled={generatingSeo}
                onClick={async () => {
                  if (!form.name.trim()) {
                    toast({ variant: 'destructive', title: 'Preencha o Nome primeiro' });
                    return;
                  }
                  setGeneratingSeo(true);
                  try {
                    const { data, error } = await supabase.functions.invoke('generate-seo', {
                      body: {
                        type: 'condominio',
                        name: form.name,
                        description: form.description,
                        infrastructure: condominioTags.join(', '),
                      },
                    });
                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);
                    setForm((f) => ({
                      ...f,
                      seo_title: data.seo_title || f.seo_title,
                      seo_description: data.seo_description || f.seo_description,
                    }));
                    toast({ title: 'SEO gerado com sucesso!' });
                  } catch (err: any) {
                    toast({ variant: 'destructive', title: 'Erro ao gerar SEO', description: err.message });
                  } finally {
                    setGeneratingSeo(false);
                  }
                }}
              >
                {generatingSeo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generatingSeo ? 'Gerando com IA...' : '✨ Gerar SEO com IA'}
              </Button>

              <div className="space-y-2">
                <Label>Título SEO</Label>
                <Input
                  value={form.seo_title}
                  onChange={set('seo_title')}
                  placeholder="Ex: Casas à Venda no Paraíso dos Lagos"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{form.seo_title.length}/60 caracteres</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição SEO</Label>
                <Textarea
                  value={form.seo_description}
                  onChange={set('seo_description')}
                  placeholder="Ex: Encontre casas de alto padrão no Paraíso dos Lagos."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">{form.seo_description.length}/160 caracteres</p>
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Salvar' : 'Cadastrar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CondominioFormDialog;
