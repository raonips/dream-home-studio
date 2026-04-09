import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Local {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  categoria: string;
  telefone: string | null;
  whatsapp: string | null;
  google_maps_link: string | null;
  imagem_destaque: string | null;
  endereco: string | null;
  horario_funcionamento: string | null;
  website: string | null;
  ativo: boolean;
  ordem: number;
}

const CATEGORIAS = [
  { value: "condominio", label: "Condomínio" },
  { value: "mercado", label: "Mercado" },
  { value: "padaria", label: "Padaria" },
  { value: "restaurante", label: "Restaurante" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "saude", label: "Saúde" },
  { value: "gas", label: "Gás" },
  { value: "limpeza", label: "Materiais de Limpeza" },
  { value: "farmacia", label: "Farmácia" },
  { value: "utilidade", label: "Utilidade" },
];

const emptyForm = {
  nome: "",
  slug: "",
  descricao: "",
  categoria: "utilidade",
  telefone: "",
  whatsapp: "",
  google_maps_link: "",
  imagem_destaque: "",
  endereco: "",
  horario_funcionamento: "",
  website: "",
  ativo: true,
  ordem: 0,
};

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const AdminLocais = () => {
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Local | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("all");

  const fetchLocais = async () => {
    const { data } = await supabase.from("locais").select("*").order("ordem", { ascending: true }).order("nome", { ascending: true });
    setLocais((data as Local[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLocais(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (local: Local) => {
    setEditing(local);
    setForm({
      nome: local.nome,
      slug: local.slug,
      descricao: local.descricao || "",
      categoria: local.categoria,
      telefone: local.telefone || "",
      whatsapp: local.whatsapp || "",
      google_maps_link: local.google_maps_link || "",
      imagem_destaque: local.imagem_destaque || "",
      endereco: local.endereco || "",
      horario_funcionamento: local.horario_funcionamento || "",
      website: local.website || "",
      ativo: local.ativo,
      ordem: local.ordem,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome || !form.slug) {
      toast({ title: "Preencha nome e slug", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome,
      slug: form.slug,
      descricao: form.descricao || null,
      categoria: form.categoria,
      telefone: form.telefone || null,
      whatsapp: form.whatsapp || null,
      google_maps_link: form.google_maps_link || null,
      imagem_destaque: form.imagem_destaque || null,
      endereco: form.endereco || null,
      horario_funcionamento: form.horario_funcionamento || null,
      website: form.website || null,
      ativo: form.ativo,
      ordem: form.ordem,
    };

    if (editing) {
      const { error } = await supabase.from("locais").update(payload).eq("id", editing.id);
      if (error) toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      else toast({ title: "Local atualizado!" });
    } else {
      const { error } = await supabase.from("locais").insert(payload);
      if (error) toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      else toast({ title: "Local criado!" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchLocais();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este local?")) return;
    await supabase.from("locais").delete().eq("id", id);
    toast({ title: "Local excluído" });
    fetchLocais();
  };

  const filtered = filterCat === "all" ? locais : locais.filter((l) => l.categoria === filterCat);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locais & Estabelecimentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie mercados, restaurantes, condomínios e outros locais</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Novo Local</Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm">Filtrar:</Label>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum local encontrado</TableCell></TableRow>
            ) : filtered.map((local) => (
              <TableRow key={local.id}>
                <TableCell className="font-medium">{local.nome}</TableCell>
                <TableCell><Badge variant="secondary">{CATEGORIAS.find((c) => c.value === local.categoria)?.label || local.categoria}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">/locais/{local.slug}</TableCell>
                <TableCell>{local.ativo ? <Badge className="bg-green-100 text-green-800">Sim</Badge> : <Badge variant="outline">Não</Badge>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(local)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(local.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Local" : "Novo Local"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => { setForm({ ...form, nome: e.target.value, slug: editing ? form.slug : slugify(e.target.value) }); }} />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={4} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(71) 99999-9999" />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5571999999999" />
              </div>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div>
              <Label>Link do Google Maps</Label>
              <Input value={form.google_maps_link} onChange={(e) => setForm({ ...form, google_maps_link: e.target.value })} placeholder="https://maps.google.com/..." />
            </div>
            <div>
              <Label>Imagem Destaque (URL)</Label>
              <Input value={form.imagem_destaque} onChange={(e) => setForm({ ...form, imagem_destaque: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horário de Funcionamento</Label>
                <Input value={form.horario_funcionamento} onChange={(e) => setForm({ ...form, horario_funcionamento: e.target.value })} placeholder="Seg-Sex: 8h-18h" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
              <Label>Ativo (visível no site)</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Salvando..." : editing ? "Salvar Alterações" : "Criar Local"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLocais;
