import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { removeStorageFiles } from "@/lib/storageCleanup";
import GuiaFeaturedImageUpload from "@/components/admin/GuiaFeaturedImageUpload";
import RichTextEditorWithLocais from "@/components/admin/RichTextEditorWithLocais";

interface GuiaCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  icone: string | null;
  ordem: number;
  imagem: string | null;
  imagem_mobile: string | null;
}

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const AdminGuiaCategorias = () => {
  const [categorias, setCategorias] = useState<GuiaCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GuiaCategoria | null>(null);
  const [form, setForm] = useState({ nome: "", slug: "", descricao: "", icone: "", ordem: 0, imagem: "", imagem_mobile: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("guia_categorias").select("*").order("ordem");
    setCategorias(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ nome: "", slug: "", descricao: "", icone: "", ordem: 0, imagem: "", imagem_mobile: "" });
    setDialogOpen(true);
  };

  const openEdit = (cat: GuiaCategoria) => {
    setEditing(cat);
    setForm({ nome: cat.nome, slug: cat.slug, descricao: cat.descricao ?? "", icone: cat.icone ?? "", ordem: cat.ordem, imagem: cat.imagem ?? "", imagem_mobile: cat.imagem_mobile ?? "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      slug: form.slug.trim() || slugify(form.nome),
      descricao: form.descricao.trim() || null,
      icone: form.icone.trim() || null,
      ordem: form.ordem,
      imagem: form.imagem.trim() || null,
      imagem_mobile: form.imagem_mobile.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("guia_categorias").update(payload).eq("id", editing.id)
      : await supabase.from("guia_categorias").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? "Categoria atualizada" : "Categoria criada" });
      setDialogOpen(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    const cat = categorias.find(c => c.id === id);
    if (cat?.imagem) {
      const toDelete = [cat.imagem];
      if (cat.imagem_mobile) toDelete.push(cat.imagem_mobile);
      removeStorageFiles(toDelete).catch(() => {});
    }
    const { error } = await supabase.from("guia_categorias").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Categoria excluída" });
      fetchData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorias do Guia</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova Categoria</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : categorias.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhuma categoria criada.</p>
      ) : (
        <div className="space-y-3">
          {categorias.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {cat.imagem && (
                    <img src={cat.imagem} alt="" className="h-10 w-10 rounded-md object-cover" />
                  )}
                  <div>
                    <span className="font-semibold">{cat.icone && `${cat.icone} `}{cat.nome}</span>
                    <span className="text-xs text-muted-foreground ml-2">/{cat.slug}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="outline" className="text-destructive" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value, slug: slugify(e.target.value) })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div>
              <Label>Descrição (editor rico — pode inserir cards de locais)</Label>
              <RichTextEditorWithLocais
                value={form.descricao}
                onChange={(v) => setForm({ ...form, descricao: v })}
                placeholder="Escreva uma introdução editorial e insira cards de locais em destaque..."
              />
            </div>
            <GuiaFeaturedImageUpload
              label="Imagem da Categoria"
              value={form.imagem}
              mobileValue={form.imagem_mobile}
              onChange={(desktop, mobile) => setForm({ ...form, imagem: desktop, imagem_mobile: mobile })}
              bucket="categorias"
              folder="categorias"
              aspectHint="Recomendado: 800×450px"
            />
            <div className="flex gap-4">
              <div className="flex-1"><Label>Ícone (emoji)</Label><Input value={form.icone} onChange={(e) => setForm({ ...form, icone: e.target.value })} /></div>
              <div className="w-24"><Label>Ordem</Label><Input type="number" value={form.ordem} onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGuiaCategorias;
