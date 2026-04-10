import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "./RichTextEditor";
import GuiaImageUploadField from "./GuiaImageUploadField";
import { removeStorageFiles } from "@/lib/storageCleanup";
import LocalSelectorDialog from "./LocalSelectorDialog";
import { MapPin } from "lucide-react";

interface GuiaPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo: string | null;
  imagem_destaque: string | null;
  categoria_id: string | null;
  tags: string[];
  autor: string | null;
  status: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  post: GuiaPost | null;
  categorias: { id: string; nome: string; slug: string }[];
  onSaved: () => void;
}

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const GuiaPostFormDialog = ({ open, onOpenChange, post, categorias, onSaved }: Props) => {
  const [form, setForm] = useState({
    titulo: "", slug: "", resumo: "", conteudo: "", imagem_destaque: "",
    categoria_id: "", tags: "", autor: "", status: "rascunho",
    seo_title: "", seo_description: "", seo_keywords: "",
  });
  const [saving, setSaving] = useState(false);
  const [localSelectorOpen, setLocalSelectorOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (post) {
      setForm({
        titulo: post.titulo, slug: post.slug, resumo: post.resumo ?? "",
        conteudo: post.conteudo ?? "", imagem_destaque: post.imagem_destaque ?? "",
        categoria_id: post.categoria_id ?? "", tags: (post.tags ?? []).join(", "),
        autor: post.autor ?? "", status: post.status,
        seo_title: post.seo_title ?? "", seo_description: post.seo_description ?? "",
        seo_keywords: post.seo_keywords ?? "",
      });
    } else {
      setForm({
        titulo: "", slug: "", resumo: "", conteudo: "", imagem_destaque: "",
        categoria_id: "", tags: "", autor: "", status: "rascunho",
        seo_title: "", seo_description: "", seo_keywords: "",
      });
    }
  }, [post, open]);

  const handleSave = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);

    const payload = {
      titulo: form.titulo.trim(),
      slug: form.slug.trim() || slugify(form.titulo),
      resumo: form.resumo.trim() || null,
      conteudo: form.conteudo || null,
      imagem_destaque: form.imagem_destaque.trim() || null,
      categoria_id: form.categoria_id || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      autor: form.autor.trim() || null,
      status: form.status,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      seo_keywords: form.seo_keywords.trim() || null,
      published_at: form.status === "publicado" ? (post?.published_at ?? new Date().toISOString()) : null,
    };

    const { error } = post
      ? await supabase.from("guia_posts").update(payload).eq("id", post.id)
      : await supabase.from("guia_posts").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: post ? "Postagem atualizada" : "Postagem criada" });
      onOpenChange(false);
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Editar Postagem" : "Nova Postagem"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value, slug: post ? form.slug : slugify(e.target.value) })} /></div>
          <div><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div><Label>Resumo</Label><Textarea value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} rows={2} /></div>
          <div>
            <Label>Conteúdo</Label>
            <RichTextEditor value={form.conteudo} onChange={(v) => setForm({ ...form, conteudo: v })} />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLocalSelectorOpen(true)}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Inserir Card de Local
          </Button>

          <LocalSelectorDialog
            open={localSelectorOpen}
            onOpenChange={setLocalSelectorOpen}
            onSelect={(id, nome) => {
              const marker = `[LOCAL_CARD: ${id}]`;
              setForm((prev) => ({
                ...prev,
                conteudo: (prev.conteudo || "") + `<p>${marker}</p>`,
              }));
              toast({ title: `Card de "${nome}" inserido` });
            }}
          />

          <GuiaImageUploadField
            label="Imagem Destaque"
            value={form.imagem_destaque}
            onChange={(url) => setForm({ ...form, imagem_destaque: url })}
            bucket="property-images"
            folder="guia-posts"
            aspectHint="Recomendado: 1200×630px"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Tags (separadas por vírgula)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
          <div><Label>Autor</Label><Input value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} /></div>

          {/* SEO */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">SEO</h3>
            <div className="space-y-3">
              <div><Label>Título SEO</Label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></div>
              <div><Label>Meta Descrição</Label><Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} rows={2} /></div>
              <div><Label>Palavras-chave</Label><Input value={form.seo_keywords} onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })} /></div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuiaPostFormDialog;
