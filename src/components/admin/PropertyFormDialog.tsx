import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Settings, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageGalleryUpload from '@/components/admin/ImageGalleryUpload';
import LocationPicker from '@/components/admin/LocationPicker';
import CreatableTagSelect from '@/components/admin/CreatableTagSelect';
import { compressAndUploadCover } from '@/lib/imageCompression';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { PropertyRow } from '@/pages/admin/AdminProperties';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PropertyRow | null;
  onSuccess: () => void;
}

const PropertyFormDialog = ({ open, onOpenChange, editing, onSuccess }: Props) => {
  const { toast } = useToast();
  const siteSettings = useSiteSettings();
  const [loading, setLoading] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState(false);
  const [condominios, setCondominios] = useState<{ slug: string; name: string }[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [tagsArray, setTagsArray] = useState<string[]>([]);

  const generateSlug = (title: string) =>
    title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const [form, setForm] = useState({
    title: '', slug: '', description: '', price: '', price_formatted: '', location: '',
    area: '', bedrooms: '', bathrooms: '', parking: '',
    highlight_tag: '', partnership: '', property_type: 'casa',
    condominio_slug: '', status: 'active',
    seo_title: '', seo_description: '', video_url: '',
    transaction_type: 'venda', max_guests: '', daily_rate: '',
    cleaning_fee: '', ical_url: '',
    latitude: '', longitude: '', map_privacy: 'exact',
  });

  useEffect(() => {
    supabase.from('condominios').select('slug, name').then(({ data }) => {
      if (data) setCondominios(data);
    });
  }, []);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title, slug: (editing as any).slug || generateSlug(editing.title),
        description: editing.description,
        price: String(editing.price), price_formatted: editing.price_formatted,
        location: editing.location, area: String(editing.area),
        bedrooms: String(editing.bedrooms), bathrooms: String(editing.bathrooms),
        parking: String(editing.parking),
        highlight_tag: (editing as any).highlight_tag || '',
        partnership: editing.partnership,
        property_type: editing.property_type, condominio_slug: editing.condominio_slug || '',
        status: editing.status,
        seo_title: (editing as any).seo_title || '',
        seo_description: (editing as any).seo_description || '',
        video_url: (editing as any).video_url || '',
        transaction_type: (editing as any).transaction_type || 'venda',
        max_guests: String((editing as any).max_guests || ''),
        daily_rate: String((editing as any).daily_rate || ''),
        cleaning_fee: String((editing as any).cleaning_fee || ''),
        ical_url: (editing as any).ical_url || '',
        latitude: String((editing as any).latitude || ''),
        longitude: String((editing as any).longitude || ''),
        map_privacy: (editing as any).map_privacy || 'exact',
      });
      const editImages: string[] = [];
      if (editing.image_url) editImages.push(editing.image_url);
      if (editing.images) {
        for (const img of editing.images) {
          if (img && !editImages.includes(img)) editImages.push(img);
        }
      }
      setImages(editImages);
      setTagsArray(editing.tags || []);
    } else {
      setForm({
        title: '', slug: '', description: '', price: '', price_formatted: '', location: '',
        area: '', bedrooms: '', bathrooms: '', parking: '',
        highlight_tag: '', partnership: '', property_type: 'casa',
        condominio_slug: '', status: 'active',
        seo_title: '', seo_description: '', video_url: '',
        transaction_type: 'venda', max_guests: '', daily_rate: '',
        cleaning_fee: '', ical_url: '',
        latitude: '', longitude: '', map_privacy: 'exact',
      });
      setImages([]);
      setTagsArray([]);
    }
  }, [editing, open]);

  const isTemporada = form.transaction_type === 'temporada' || form.transaction_type === 'ambos';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = form.title.trim();
    if (!title || title.length < 3) {
      toast({ variant: 'destructive', title: 'O título deve ter pelo menos 3 caracteres' });
      return;
    }
    if (title.length > 200) {
      toast({ variant: 'destructive', title: 'O título deve ter no máximo 200 caracteres' });
      return;
    }
    if (form.description.trim().length > 5000) {
      toast({ variant: 'destructive', title: 'A descrição deve ter no máximo 5000 caracteres' });
      return;
    }
    if (form.video_url.trim() && !/^https?:\/\/.+/i.test(form.video_url.trim())) {
      toast({ variant: 'destructive', title: 'URL de vídeo inválida' });
      return;
    }
    if (images.length === 0) {
      toast({ variant: 'destructive', title: 'Adicione pelo menos 1 foto' });
      return;
    }
    setLoading(true);

    // Try to generate compressed cover + thumbnail from the first image
    let thumbnailUrl = (editing as any)?.thumbnail_url || '';
    const coverUrl = images[0] || '';

    // If the cover image changed (new upload or reorder), regenerate thumbnail
    const previousCover = editing ? (editing.image_url || '') : '';
    const coverChanged = coverUrl && coverUrl !== previousCover;

    if (coverChanged) {
      try {
        // Fetch the cover image as a File to compress it
        const resp = await fetch(coverUrl);
        const blob = await resp.blob();
        const coverFile = new File([blob], 'cover.jpg', { type: blob.type || 'image/jpeg' });
        const result = await compressAndUploadCover(coverFile, 'properties', siteSettings.watermark_url ? {
          watermark_url: siteSettings.watermark_url,
          watermark_position: siteSettings.watermark_position,
          watermark_opacity: siteSettings.watermark_opacity,
          watermark_scale: siteSettings.watermark_scale,
        } : undefined);
        thumbnailUrl = result.thumbnailUrl;
      } catch (err) {
        console.warn('[PropertyForm] Thumbnail generation failed, using original', err);
      }
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || generateSlug(form.title),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      price_formatted: form.price_formatted.trim(),
      location: form.location.trim(),
      area: Number(form.area) || 0,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      parking: Number(form.parking) || 0,
      tags: tagsArray,
      highlight_tag: form.highlight_tag.trim(),
      image_url: coverUrl,
      images: images,
      featured_image: coverUrl,
      partnership: form.partnership.trim(),
      property_type: form.property_type,
      condominio_slug: form.condominio_slug || null,
      status: form.status,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      video_url: form.video_url.trim(),
      transaction_type: form.transaction_type,
      max_guests: Number(form.max_guests) || 0,
      daily_rate: Number(form.daily_rate) || 0,
      cleaning_fee: Number(form.cleaning_fee) || 0,
      ical_url: form.ical_url.trim(),
      latitude: parseFloat(form.latitude) || null,
      longitude: parseFloat(form.longitude) || null,
      map_privacy: form.map_privacy,
      thumbnail_url: thumbnailUrl,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from('properties').update(payload as any).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('properties').insert(payload as any));
    }

    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: editing ? 'Imóvel atualizado' : 'Imóvel criado com sucesso' });
      onOpenChange(false);
      onSuccess();
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Imóvel' : 'Adicionar Novo Imóvel'}</DialogTitle>
          <DialogDescription>Preencha os dados e adicione as fotos do imóvel.</DialogDescription>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => {
                    const title = e.target.value;
                    setForm((f) => ({ ...f, title, slug: editing ? f.slug : generateSlug(title) }));
                  }} required maxLength={200} />
                  <p className="text-xs text-muted-foreground">{form.title.length}/200 caracteres</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Slug (URL amigável)</Label>
                  <Input value={form.slug} onChange={set('slug')} placeholder="gerado-automaticamente" />
                  <p className="text-xs text-muted-foreground">Gerado automaticamente a partir do título. Edite se necessário.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descrição</Label>
                  <RichTextEditor
                    value={form.description}
                    onChange={(val) => setForm((f) => ({ ...f, description: val }))}
                    placeholder="Descreva o imóvel com detalhes..."
                  />
                </div>

                {/* Transaction Type */}
                <div className="space-y-2">
                  <Label>Tipo de Transação</Label>
                  <Select value={form.transaction_type} onValueChange={(v) => setForm((f) => ({ ...f, transaction_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venda">Venda</SelectItem>
                      <SelectItem value="temporada">Temporada</SelectItem>
                      <SelectItem value="ambos">Venda + Temporada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Imóvel</Label>
                  <Select value={form.property_type} onValueChange={(v) => setForm((f) => ({ ...f, property_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="sitio">Sítio</SelectItem>
                      <SelectItem value="terreno">Terreno</SelectItem>
                      <SelectItem value="apartamento">Apartamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preço de Venda (R$)</Label>
                  <Input type="number" value={form.price} onChange={set('price')} />
                </div>
                <div className="space-y-2">
                  <Label>Preço Formatado</Label>
                  <Input placeholder="R$ 950.000" value={form.price_formatted} onChange={set('price_formatted')} />
                </div>
              </div>

              {/* Temporada-specific fields */}
              {isTemporada && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-primary mb-2">🏖️ Dados de Temporada</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor da Diária (R$)</Label>
                    <Input type="number" placeholder="0.00" value={form.daily_rate} onChange={set('daily_rate')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Máx. Hóspedes</Label>
                    <Input type="number" placeholder="0" value={form.max_guests} onChange={set('max_guests')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa de Limpeza (R$)</Label>
                    <Input type="number" placeholder="0.00" value={form.cleaning_fee} onChange={set('cleaning_fee')} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>URL iCal (Airbnb/Booking)</Label>
                    <Input placeholder="https://www.airbnb.com/calendar/ical/..." value={form.ical_url} onChange={set('ical_url')} />
                    <p className="text-xs text-muted-foreground">Para futura sincronização de disponibilidade</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Disponível</SelectItem>
                      <SelectItem value="sold">Vendido</SelectItem>
                      <SelectItem value="rented">Alugado</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condomínio</Label>
                  <Select value={form.condominio_slug || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, condominio_slug: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {condominios.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input value={form.location} onChange={set('location')} />
                </div>
                <div className="space-y-2">
                  <Label>Parceria</Label>
                  <Input placeholder="Amar Imóvel" value={form.partnership} onChange={set('partnership')} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Área (m²)</Label>
                  <Input type="number" value={form.area} onChange={set('area')} />
                </div>
                <div className="space-y-2">
                  <Label>Quartos</Label>
                  <Input type="number" value={form.bedrooms} onChange={set('bedrooms')} />
                </div>
                <div className="space-y-2">
                  <Label>Banheiros</Label>
                  <Input type="number" value={form.bathrooms} onChange={set('bathrooms')} />
                </div>
                <div className="space-y-2">
                  <Label>Vagas</Label>
                  <Input type="number" value={form.parking} onChange={set('parking')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tag de Destaque (badge na foto)</Label>
                  <Input placeholder="Ex: Exclusivo" value={form.highlight_tag} onChange={set('highlight_tag')} maxLength={20} />
                  <p className="text-xs text-muted-foreground">{form.highlight_tag.length}/20 caracteres</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Características</Label>
                  <CreatableTagSelect value={tagsArray} onChange={setTagsArray} />
                  <p className="text-xs text-muted-foreground">Digite, selecione ou cole tags separadas por vírgula.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>URL do Vídeo (YouTube)</Label>
                <Input placeholder="https://www.youtube.com/watch?v=..." value={form.video_url} onChange={set('video_url')} />
              </div>

              {/* Geolocation */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onLatChange={(v) => setForm((f) => ({ ...f, latitude: v }))}
                  onLngChange={(v) => setForm((f) => ({ ...f, longitude: v }))}
                />
                <div className="space-y-2">
                  <Label>Tipo de Exibição no Mapa</Label>
                  <Select value={form.map_privacy} onValueChange={(v) => setForm((f) => ({ ...f, map_privacy: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exact">📍 Ponto Exato</SelectItem>
                      <SelectItem value="approximate">🔵 Área Aproximada (raio 500m)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fotos (mín. 1 — a primeira será a capa e imagem de compartilhamento)</Label>
                <p className="text-xs text-muted-foreground">A 1ª foto será usada como imagem de destaque no WhatsApp e redes sociais (Open Graph).</p>
                <ImageGalleryUpload images={images} onChange={setImages} folder="properties" />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="rounded-lg bg-muted p-4 mb-4">
                <p className="text-sm text-muted-foreground">
                  Configure os campos abaixo para otimizar a página do imóvel nos mecanismos de busca.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
                disabled={generatingSeo}
                onClick={async () => {
                  if (!form.title.trim()) {
                    toast({ variant: 'destructive', title: 'Preencha o Título primeiro' });
                    return;
                  }
                  setGeneratingSeo(true);
                  try {
                    const { data, error } = await supabase.functions.invoke('generate-seo', {
                      body: {
                        type: 'imovel',
                        name: form.title,
                        description: form.description,
                        price: form.price_formatted || form.price,
                        infrastructure: tagsArray.join(', '),
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
                <Input value={form.seo_title} onChange={set('seo_title')} placeholder="Ex: Casa 4 Quartos com Piscina em Barra do Jacuípe BA" maxLength={60} />
                <p className="text-xs text-muted-foreground">{form.seo_title.length}/60 caracteres</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição SEO</Label>
                <Textarea value={form.seo_description} onChange={set('seo_description')} placeholder="Ex: Linda casa de 4 quartos com piscina privativa." rows={3} maxLength={160} />
                <p className="text-xs text-muted-foreground">{form.seo_description.length}/160 caracteres</p>
              </div>
            </TabsContent>
          </Tabs>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyFormDialog;
