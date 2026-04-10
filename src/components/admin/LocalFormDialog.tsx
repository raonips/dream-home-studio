import { useEffect, useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageGalleryUpload from '@/components/admin/ImageGalleryUpload';
import GuiaImageUploadField from '@/components/admin/GuiaImageUploadField';
import ImageCropperDialog from '@/components/admin/ImageCropperDialog';
import SmartMap from '@/components/SmartMap';
import { Loader2, FileText, Settings, MapPin, Phone, Image, Download, Link, Upload, Crop } from 'lucide-react';
import { processAndUploadGuiaImage } from '@/lib/guiaImageUpload';
import { removeStorageFiles } from '@/lib/storageCleanup';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

export interface LocalRow {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoria: string;
  telefone: string | null;
  whatsapp: string | null;
  google_maps_link: string | null;
  imagem_destaque: string | null;
  imagens: string[] | null;
  endereco: string | null;
  horario_funcionamento: string | null;
  website: string | null;
  ativo: boolean;
  ordem: number;
  latitude?: number | null;
  longitude?: number | null;
  url_vendas?: string | null;
  banner_publicidade?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  logo_url?: string | null;
  cupom_desconto?: string | null;
  valor_desconto?: string | null;
}

const CATEGORIAS = [
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

const DEFAULT_LAT = -12.6946;
const DEFAULT_LNG = -38.1345;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: LocalRow | null;
  onSuccess: () => void;
}

const generateSlug = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* ── Logo Upload with Cropper sub-component ── */
const LogoUploadWithCropper = ({ value, onChange, slug }: { value: string; onChange: (url: string) => void; slug: string }) => {
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Selecione uma imagem válida' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Imagem muito grande (máx 5MB)' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleCropComplete = useCallback(async (blob: Blob) => {
    setUploading(true);
    setProgress(5);
    try {
      const file = new File([blob], `logo-${slug}.webp`, { type: 'image/webp' });
      const publicUrl = await processAndUploadGuiaImage({
        file,
        bucket: 'property-images',
        folder: `logos/${slug}`,
        oldUrl: value || undefined,
        onProgress: setProgress,
      });
      onChange(publicUrl);
      toast({ title: 'Logo recortada e enviada!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: err.message });
    } finally {
      setTimeout(() => { setUploading(false); setProgress(0); }, 300);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onChange, value, slug, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const removeImage = useCallback(() => {
    if (value) removeStorageFiles([value]).catch(() => {});
    onChange('');
  }, [onChange, value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <Crop className="h-4 w-4" /> Logo / Logomarca
        </Label>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={removeImage}>
            Remover
          </Button>
        )}
      </div>

      <div
        className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="h-5 w-5 mx-auto text-primary animate-spin" />
            <p className="text-xs text-primary font-medium">Enviando logo recortada...</p>
          </div>
        ) : (
          <>
            <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Clique ou arraste uma imagem para recortar</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">A ferramenta de recorte abrirá automaticamente</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
        />
      </div>
      {uploading && <Progress value={progress} className="h-1.5" />}

      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

const LocalFormDialog = ({ open, onOpenChange, editing, onSuccess }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    nome: '', slug: '', descricao: '', categoria: 'utilidade',
    telefone: '', whatsapp: '', google_maps_link: '',
    endereco: '', horario_funcionamento: '', website: '',
    ativo: true, ordem: 0,
    seo_title: '', seo_description: '',
    latitude: DEFAULT_LAT, longitude: DEFAULT_LNG,
    url_vendas: '', banner_publicidade: '',
    logo_url: '', cupom_desconto: '', valor_desconto: '',
  });

  useEffect(() => {
    if (editing) {
      setForm({
        nome: editing.nome,
        slug: editing.slug,
        descricao: editing.descricao || '',
        categoria: editing.categoria,
        telefone: editing.telefone || '',
        whatsapp: editing.whatsapp || '',
        google_maps_link: editing.google_maps_link || '',
        endereco: editing.endereco || '',
        horario_funcionamento: editing.horario_funcionamento || '',
        website: editing.website || '',
        ativo: editing.ativo,
        ordem: editing.ordem,
        seo_title: editing.seo_title || '',
        seo_description: editing.seo_description || '',
        latitude: editing.latitude ?? DEFAULT_LAT,
        longitude: editing.longitude ?? DEFAULT_LNG,
        url_vendas: editing.url_vendas || '',
        banner_publicidade: editing.banner_publicidade || '',
        logo_url: editing.logo_url || '',
        cupom_desconto: (editing as any).cupom_desconto || '',
        valor_desconto: (editing as any).valor_desconto || '',
      });
      const editImages: string[] = [];
      if (editing.imagem_destaque) editImages.push(editing.imagem_destaque);
      if (editing.imagens) {
        for (const img of editing.imagens) {
          if (img && !editImages.includes(img)) editImages.push(img);
        }
      }
      setImages(editImages);
    } else {
      setForm({
        nome: '', slug: '', descricao: '', categoria: 'utilidade',
        telefone: '', whatsapp: '', google_maps_link: '',
        endereco: '', horario_funcionamento: '', website: '',
        ativo: true, ordem: 0, seo_title: '', seo_description: '',
        latitude: DEFAULT_LAT, longitude: DEFAULT_LNG,
        url_vendas: '', banner_publicidade: '', logo_url: '',
        cupom_desconto: '', valor_desconto: '',
      });
      setImages([]);
    }
  }, [editing, open]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nome = form.nome.trim();
    if (!nome || nome.length < 2) {
      toast({ variant: 'destructive', title: 'O nome deve ter pelo menos 2 caracteres' });
      return;
    }

    setLoading(true);

    const coverUrl = images[0] || null;

    const payload = {
      nome,
      slug: form.slug.trim() || generateSlug(nome),
      descricao: form.descricao.trim() || null,
      categoria: form.categoria,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      google_maps_link: form.google_maps_link.trim() || null,
      imagem_destaque: coverUrl,
      imagens: images,
      endereco: form.endereco.trim() || null,
      horario_funcionamento: form.horario_funcionamento.trim() || null,
      website: form.website.trim() || null,
      ativo: form.ativo,
      ordem: form.ordem,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
      url_vendas: form.url_vendas?.trim() || null,
      banner_publicidade: form.banner_publicidade?.trim() || null,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      logo_url: form.logo_url?.trim() || null,
      cupom_desconto: form.cupom_desconto?.trim() || null,
      valor_desconto: form.valor_desconto?.trim() || null,
    } as any;

    let error;
    if (editing) {
      ({ error } = await supabase.from('locais').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('locais').insert(payload));
    }

    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: editing ? 'Local atualizado' : 'Local criado!' });
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Local' : 'Novo Local'}</DialogTitle>
          <DialogDescription>Preencha os dados do estabelecimento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="main" className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Dados
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-1.5 text-xs">
                <Image className="h-3.5 w-3.5" /> Arquivos
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-1.5 text-xs">
                <Phone className="h-3.5 w-3.5" /> Contato
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-1.5 text-xs">
                <MapPin className="h-3.5 w-3.5" /> Mapa
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-1.5 text-xs">
                <Settings className="h-3.5 w-3.5" /> SEO
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Dados Principais ── */}
            <TabsContent value="main" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={form.nome}
                    onChange={(e) => {
                      const nome = e.target.value;
                      setForm((f) => ({ ...f, nome, slug: editing ? f.slug : generateSlug(nome) }));
                    }}
                    required
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">{form.nome.length}/200</p>
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL) *</Label>
                  <Input value={form.slug} onChange={set('slug')} placeholder="nome-do-local" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ── Campos de Publicidade (só para condomínio) ── */}
              {form.categoria === 'condominio' && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-primary">🏠 Publicidade Imobiliária</h3>
                  <div className="space-y-2">
                    <Label>URL de Vendas</Label>
                    <Input
                      value={form.url_vendas}
                      onChange={set('url_vendas')}
                      placeholder="Ex: /imoveis?condominio=villas-do-jacuipe ou https://..."
                    />
                    <p className="text-xs text-muted-foreground">Link do botão "Ver Imóveis Disponíveis" no banner.</p>
                  </div>
                  <GuiaImageUploadField
                    label="Banner de Publicidade"
                    value={form.banner_publicidade}
                    onChange={(url) => setForm((f) => ({ ...f, banner_publicidade: url }))}
                    bucket="property-images"
                    folder="locais/banners"
                    aspectHint="Recomendado: 1200×400px (imagem de fundo do banner)"
                  />
                </div>
              )}

              {/* ── Cupom de Desconto ── */}
              <div className="rounded-lg border border-amber-300/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">🎟️ Cupom de Desconto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código do Cupom</Label>
                    <Input
                      value={form.cupom_desconto}
                      onChange={set('cupom_desconto')}
                      placeholder="Ex: BARRA10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor do Desconto</Label>
                    <Input
                      value={form.valor_desconto}
                      onChange={set('valor_desconto')}
                      placeholder="Ex: 10% OFF ou R$ 20,00"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Se preenchido, o cupom será exibido no card e incluído na mensagem do WhatsApp.</p>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <RichTextEditor
                  value={form.descricao}
                  onChange={(val) => setForm((f) => ({ ...f, descricao: val }))}
                  placeholder="Descreva o estabelecimento com detalhes..."
                />
              </div>

              <div className="space-y-2">
                <Label>Fotos (a primeira será a capa)</Label>
                <p className="text-xs text-muted-foreground">A 1ª foto será usada como imagem de destaque.</p>
                <ImageGalleryUpload images={images} onChange={setImages} folder="locais" />
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
                <Label>Ativo (visível no site)</Label>
              </div>
            </TabsContent>

            {/* ── Tab: Arquivos (Logo with Cropper) ── */}
            <TabsContent value="files" className="space-y-4 mt-4">
              <LogoUploadWithCropper
                value={form.logo_url}
                onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))}
                slug={form.slug || 'novo-local'}
              />

              {form.logo_url && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">Preview da Logo</p>
                  <div className="flex justify-center">
                    <img
                      src={form.logo_url}
                      alt="Logo"
                      className="max-h-32 max-w-[200px] object-contain rounded-md shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch(form.logo_url);
                          const blob = await res.blob();
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = `logo-${form.slug || 'local'}.${blob.type.split('/')[1] || 'png'}`;
                          a.click();
                          URL.revokeObjectURL(a.href);
                        } catch {
                          toast({ variant: 'destructive', title: 'Erro ao baixar logo' });
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-1.5" /> Baixar Logo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(form.logo_url);
                        sonnerToast.success('Link copiado para a área de transferência!');
                      }}
                    >
                      <Link className="h-4 w-4 mr-1.5" /> Copiar Link
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Tab: Contato ── */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={set('telefone')} placeholder="(71) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="5571999999999" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={set('endereco')} placeholder="Rua, número, bairro" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Link do Google Maps</Label>
                <Input value={form.google_maps_link} onChange={set('google_maps_link')} placeholder="https://maps.google.com/..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário de Funcionamento</Label>
                  <Input value={form.horario_funcionamento} onChange={set('horario_funcionamento')} placeholder="Seg-Sex: 8h-18h" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={set('website')} placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ordem de exibição</Label>
                <Input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setForm((f) => ({ ...f, ordem: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-muted-foreground">Menor número = aparece primeiro</p>
              </div>
            </TabsContent>

            {/* ── Tab: Mapa / Geolocalização ── */}
            <TabsContent value="map" className="space-y-4 mt-4">
              <div className="rounded-lg bg-muted p-4 mb-2">
                <p className="text-sm text-muted-foreground">
                  Clique no mapa para definir a localização exata do estabelecimento. As coordenadas serão salvas automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm((f) => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm((f) => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <SmartMap
                latitude={form.latitude}
                longitude={form.longitude}
                zoom={15}
                interactive
                onLocationSelect={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
                className="w-full h-[350px] rounded-xl border border-border"
                title={form.nome || 'Local'}
              />
            </TabsContent>

            {/* ── Tab: SEO ── */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="rounded-lg bg-muted p-4 mb-4">
                <p className="text-sm text-muted-foreground">
                  Configure os campos abaixo para otimizar a página nos mecanismos de busca.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Título SEO</Label>
                <Input value={form.seo_title} onChange={set('seo_title')} placeholder="Ex: Padaria Beira Mar em Barra do Jacuípe" maxLength={60} />
                <p className="text-xs text-muted-foreground">{form.seo_title.length}/60 caracteres</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição SEO</Label>
                <Input value={form.seo_description} onChange={set('seo_description')} placeholder="Ex: Encontre pães frescos e café da manhã..." maxLength={160} />
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

export default LocalFormDialog;
