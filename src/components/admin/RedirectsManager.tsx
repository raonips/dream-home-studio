import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, ArrowRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { invalidateRedirectCache } from "@/components/RedirectHandler";

interface Redirect {
  id: string;
  old_path: string;
  new_path: string;
  is_active: boolean;
}

const normalizePath = (p: string) => {
  let v = (p || "").trim();
  if (!v) return v;
  if (!v.startsWith("/") && !v.startsWith("http")) v = "/" + v;
  return v;
};

const RedirectsManager = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [oldPath, setOldPath] = useState("");
  const [newPath, setNewPath] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("url_redirects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setItems((data as Redirect[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAdd = async () => {
    const oldP = normalizePath(oldPath);
    const newP = normalizePath(newPath);
    if (!oldP || !newP) {
      toast({ title: "Preencha ambos os campos", variant: "destructive" });
      return;
    }
    if (oldP === newP) {
      toast({ title: "Origem e destino devem ser diferentes", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("url_redirects").insert({
      old_path: oldP,
      new_path: newP,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setOldPath("");
    setNewPath("");
    invalidateRedirectCache();
    toast({ title: "Redirecionamento criado" });
    fetchAll();
  };

  const handleToggle = async (item: Redirect) => {
    const { error } = await (supabase as any)
      .from("url_redirects")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    invalidateRedirectCache();
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este redirecionamento?")) return;
    const { error } = await (supabase as any).from("url_redirects").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    invalidateRedirectCache();
    toast({ title: "Excluído" });
    fetchAll();
  };

  const handleUpdate = async (item: Redirect, field: "old_path" | "new_path", value: string) => {
    const v = normalizePath(value);
    if (!v) return;
    const { error } = await (supabase as any)
      .from("url_redirects")
      .update({ [field]: v })
      .eq("id", item.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    invalidateRedirectCache();
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Redirecionamento (301)</CardTitle>
          <CardDescription>
            Use para encaminhar URLs antigas (ex: do WordPress) para os novos caminhos do site, preservando o SEO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-muted-foreground">Caminho Antigo</label>
              <Input
                value={oldPath}
                onChange={(e) => setOldPath(e.target.value)}
                placeholder="/categoria/pousada"
              />
            </div>
            <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground mb-3" />
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-muted-foreground">Novo Caminho</label>
              <Input
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="/guia/categoria/pousada"
              />
            </div>
            <Button onClick={handleAdd} disabled={saving} className="w-full md:w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redirecionamentos cadastrados</CardTitle>
          <CardDescription>{items.length} regra(s) no total</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Nenhum redirecionamento cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caminho Antigo</TableHead>
                  <TableHead>Novo Caminho</TableHead>
                  <TableHead className="w-24 text-center">Ativo</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        defaultValue={item.old_path}
                        onBlur={(e) => {
                          if (e.target.value !== item.old_path) handleUpdate(item, "old_path", e.target.value);
                        }}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={item.new_path}
                        onBlur={(e) => {
                          if (e.target.value !== item.new_path) handleUpdate(item, "new_path", e.target.value);
                        }}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={item.is_active} onCheckedChange={() => handleToggle(item)} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RedirectsManager;
