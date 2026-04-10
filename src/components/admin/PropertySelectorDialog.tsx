import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Home } from "lucide-react";

interface Property {
  id: string;
  title: string | null;
  location: string | null;
  featured_image: string | null;
  image_url: string | null;
  transaction_type: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (id: string, title: string) => void;
}

const PropertySelectorDialog = ({ open, onOpenChange, onSelect }: Props) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("properties")
      .select("id, title, location, featured_image, image_url, transaction_type")
      .eq("status", "active")
      .order("title")
      .then(({ data }) => {
        setProperties(data ?? []);
        setLoading(false);
      });
  }, [open]);

  const filtered = properties.filter((p) =>
    (p.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Inserir Card de Imóvel</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar imóvel..."
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
            <p className="text-center text-muted-foreground py-8 text-sm">Nenhum imóvel encontrado.</p>
          ) : (
            filtered.map((prop) => {
              const img = prop.featured_image || prop.image_url;
              return (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => {
                    onSelect(prop.id, prop.title || "Imóvel");
                    onOpenChange(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors"
                >
                  {img ? (
                    <img src={img} alt={prop.title || ""} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <Home className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{prop.title || "Sem título"}</p>
                    {prop.location && <p className="text-xs text-muted-foreground truncate">{prop.location}</p>}
                  </div>
                  {prop.transaction_type && (
                    <Badge variant="outline" className="text-xs capitalize ml-auto flex-shrink-0">
                      {prop.transaction_type}
                    </Badge>
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertySelectorDialog;
