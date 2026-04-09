import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageGalleryUpload from '@/components/admin/ImageGalleryUpload';
import { Loader2, FileText, Settings, MapPin, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: LocalRow | null;
  onSuccess: () => void;
}

const generateSlug = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

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
        seo_title: '',
        seo_description: '',
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
      nome: nome,
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
    };

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Local' : 'Novo Local'}</DialogTitle>
          <DialogDescription>Preencha os dados do estabelecimento. Fotos são opcionais no primeiro cadastro.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="main" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                SEO
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

            {/* ── Tab: Contato & Localização ── */}
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

            {/* ── Tab: SEO ── */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="rounded-lg bg-muted p-4 mb-4">
                <p className="text-sm text-muted-foreground">
                  Configure os campos abaixo para otimizar a página nos mecanismos de busca.
                  Se deixados em branco, serão usados o Nome e a Descrição automaticamente.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Título SEO</Label>
                <Input value={form.seo_title} onChange={set('seo_title')} placeholder="Ex: Padaria Beira Mar em Barra do Jacuípe" maxLength={60} />
                <p className="text-xs text-muted-foreground">{form.seo_title.length}/60 caracteres</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição SEO</Label>
                <Textarea value={form.seo_description} onChange={set('seo_description')} placeholder="Ex: Encontre pães frescos e café da manhã..." rows={3} maxLength={160} />
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
