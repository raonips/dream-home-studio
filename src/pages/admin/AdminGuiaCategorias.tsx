import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2, Save, Upload, Link2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface GuiaCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  icone: string | null;
  ordem: number;
  imagem: string | null;
}

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const BUCKET = "categorias";

/* ── Image Upload Field ── */
function ImageUploadField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Selecione uma imagem válida" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Imagem muito grande (máx 5MB)" });
      return;
    }

    setUploading(true);
    setProgress(10);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    setProgress(30);
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    setProgress(80);

    if (error) {
      toast({ variant: "destructive", title: "Erro no upload", description: error.message });
      setUploading(false);
      setProgress(0);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setProgress(100);
    onChange(publicUrl);
    setTimeout(() => { setUploading(false); setProgress(0); }, 400);
  }, [onChange, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const removeImage = useCallback(() => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Imagem da Categoria</Label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`text-xs px-2 py-1 rounded ${mode === "upload" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            <Upload className="h-3 w-3 inline mr-1" />Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={`text-xs px-2 py-1 rounded ${mode === "link" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            <Link2 className="h-3 w-3 inline mr-1" />Link
          </button>
        </div>
      </div>

      {/* Preview */}
      {value && (
        <div className="relative rounded-lg overflow-hidden border border-border aspect-video max-w-[220px]">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {mode === "link" ? (
        <Input
          placeholder="https://exemplo.com/imagem.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <>
          <div
            className="border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 mx-auto text-primary animate-spin mb-1" />
            ) : (
              <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            )}
            <p className="text-xs text-muted-foreground">
              {uploading ? "Enviando..." : "Clique ou arraste uma imagem"}
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
          {uploading && <Progress value={progress} className="h-1.5" />}
        </>
      )}
    </div>
  );
}

const AdminGuiaCategorias = () => {
  const [categorias, setCategorias] = useState<GuiaCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GuiaCategoria | null>(null);
  const [form, setForm] = useState({ nome: "", slug: "", descricao: "", icone: "", ordem: 0, imagem: "" });
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
    setForm({ nome: "", slug: "", descricao: "", icone: "", ordem: 0, imagem: "" });
    setDialogOpen(true);
  };

  const openEdit = (cat: GuiaCategoria) => {
    setEditing(cat);
    setForm({ nome: cat.nome, slug: cat.slug, descricao: cat.descricao ?? "", icone: cat.icone ?? "", ordem: cat.ordem, imagem: cat.imagem ?? "" });
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value, slug: slugify(e.target.value) })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <ImageUploadField value={form.imagem} onChange={(url) => setForm({ ...form, imagem: url })} />
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
