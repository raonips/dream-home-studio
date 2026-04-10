import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MapPin } from "lucide-react";

interface Local {
  id: string;
  nome: string;
  categoria: string;
  imagem_destaque: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string, nome: string) => void;
}

const LocalSelectorDialog = ({ open, onOpenChange, onSelect }: Props) => {
  const [locais, setLocais] = useState<Local[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("locais")
      .select("id, nome, categoria, imagem_destaque")
      .eq("ativo", true)
      .order("nome")
      .then(({ data }) => {
        setLocais(data ?? []);
        setLoading(false);
      });
  }, [open]);

  const filtered = locais.filter((l) =>
    l.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Inserir Card de Local</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar local..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhum local encontrado.</p>
          ) : (
            filtered.map((local) => (
              <button
                key={local.id}
                type="button"
                onClick={() => {
                  onSelect(local.id, local.nome);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors"
              >
                {local.imagem_destaque ? (
                  <img
                    src={local.imagem_destaque}
                    alt={local.nome}
                    className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{local.nome}</p>
                  <Badge variant="outline" className="text-xs capitalize mt-0.5">
                    {local.categoria}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocalSelectorDialog;
