import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DestinationPageFormDialog, { type DestinationPage } from "@/components/admin/DestinationPageFormDialog";

const AdminDestinationPages = () => {
  const [pages, setPages] = useState<DestinationPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DestinationPage | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("destination_pages")
      .select("*")
      .order("created_at", { ascending: false });
    setPages((data as DestinationPage[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta página?")) return;
    const { error } = await supabase.from("destination_pages").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: "Página excluída" });
      fetchData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">O Destino</h1>
          <p className="text-sm text-muted-foreground">Páginas institucionais (Praias, Rio, História, etc).</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Página
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pages.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhuma página criada.</p>
      ) : (
        <div className="space-y-3">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {p.hero_image_url && (
                    <img
                      src={p.hero_image_url}
                      alt=""
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{p.title}</h3>
                    <a
                      href={`/destino/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                    >
                      /destino/{p.slug} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setEditing(p);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DestinationPageFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        page={editing}
        onSaved={fetchData}
      />
    </div>
  );
};

export default AdminDestinationPages;
