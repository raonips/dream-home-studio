import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/admin/RichTextEditor";
import GuiaFeaturedImageUpload from "@/components/admin/GuiaFeaturedImageUpload";
import { Loader2 } from "lucide-react";

export interface DestinationPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  page: DestinationPage | null;
  onSaved: () => void;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const DestinationPageFormDialog = ({ open, onOpenChange, page, onSaved }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    hero_image_url: "",
    seo_title: "",
    seo_description: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: page?.title ?? "",
        slug: page?.slug ?? "",
        content: page?.content ?? "",
        hero_image_url: page?.hero_image_url ?? "",
        seo_title: page?.seo_title ?? "",
        seo_description: page?.seo_description ?? "",
      });
    }
  }, [open, page]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({ variant: "destructive", title: "Título e slug são obrigatórios" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug),
      content: form.content,
      hero_image_url: form.hero_image_url || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    };
    const { error } = page
      ? await supabase.from("destination_pages").update(payload).eq("id", page.id)
      : await supabase.from("destination_pages").insert(payload);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
      return;
    }
    toast({ title: page ? "Página atualizada" : "Página criada" });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page ? "Editar página" : "Nova página de destino"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({
                  ...f,
                  title,
                  slug: !page && (!f.slug || f.slug === slugify(f.title)) ? slugify(title) : f.slug,
                }));
              }}
            />
          </div>

          <div>
            <Label>Slug (URL)</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="praias"
            />
            <p className="text-xs text-muted-foreground mt-1">URL final: /destino/{form.slug || "slug"}</p>
          </div>

          <GuiaFeaturedImageUpload
            label="Imagem de Capa (Hero)"
            value={form.hero_image_url}
            onChange={(desktopUrl) => setForm((f) => ({ ...f, hero_image_url: desktopUrl }))}
            folder="destino"
            aspectHint="Recomendado: 1920x800px (proporção larga)"
          />

          <div>
            <Label>Conteúdo</Label>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm((f) => ({ ...f, content }))}
              placeholder="Escreva o conteúdo da página..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <Label>SEO Title</Label>
              <Input
                value={form.seo_title}
                onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
              />
            </div>
            <div>
              <Label>SEO Description</Label>
              <Input
                value={form.seo_description}
                onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DestinationPageFormDialog;
