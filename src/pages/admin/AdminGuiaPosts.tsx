import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GuiaPostFormDialog from "@/components/admin/GuiaPostFormDialog";

export interface GuiaPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo: string | null;
  imagem_destaque: string | null;
  imagem_destaque_mobile: string | null;
  categoria_id: string | null;
  tags: string[];
  autor: string | null;
  status: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
}

export interface GuiaCategoria {
  id: string;
  nome: string;
  slug: string;
}

const AdminGuiaPosts = () => {
  const [posts, setPosts] = useState<GuiaPost[]>([]);
  const [categorias, setCategorias] = useState<GuiaCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<GuiaPost | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [postsRes, catRes] = await Promise.all([
      supabase.from("guia_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("guia_categorias").select("id, nome, slug").order("nome"),
    ]);
    setPosts(postsRes.data ?? []);
    setCategorias(catRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este post?")) return;
    const { error } = await supabase.from("guia_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post excluído" });
      fetchData();
    }
  };

  const getCatName = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Postagens do Guia</h1>
        <Button onClick={() => { setEditingPost(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Postagem
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhuma postagem criada.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{post.titulo}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={post.status === "publicado" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{getCatName(post.categoria_id)}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="icon" variant="outline" onClick={() => { setEditingPost(post); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="text-destructive" onClick={() => handleDelete(post.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GuiaPostFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        post={editingPost}
        categorias={categorias}
        onSaved={fetchData}
      />
    </div>
  );
};

export default AdminGuiaPosts;
