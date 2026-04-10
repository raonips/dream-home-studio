import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import SafeImage from "@/components/SafeImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";

interface LocalData {
  id: string;
  nome: string;
  slug: string;
  categoria: string;
  imagem_destaque: string | null;
  endereco: string | null;
}

const LocalCardInPost = ({ localId }: { localId: string }) => {
  const [local, setLocal] = useState<LocalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("locais")
      .select("id, nome, slug, categoria, imagem_destaque, endereco")
      .eq("id", localId)
      .eq("ativo", true)
      .maybeSingle()
      .then(({ data }) => {
        setLocal(data);
        setLoading(false);
      });
  }, [localId]);

  if (loading) {
    return (
      <div className="my-6 mx-2 flex items-center justify-center py-8 rounded-xl border bg-muted/30">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!local) return null;

  return (
    <div className="my-6 mx-2 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden not-prose">
      <Link
        to={`/guia/local/${local.slug}`}
        className="flex flex-col sm:flex-row gap-0 no-underline text-foreground"
      >
        {local.imagem_destaque && (
          <div className="sm:w-40 sm:min-h-[120px] flex-shrink-0">
            <SafeImage
              src={local.imagem_destaque}
              alt={local.nome}
              className="w-full h-40 sm:h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 p-4 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-base m-0">{local.nome}</h4>
            <Badge variant="secondary" className="text-xs capitalize">
              {local.categoria}
            </Badge>
          </div>
          {local.endereco && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 m-0">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{local.endereco}</span>
            </p>
          )}
          <span className="text-primary text-sm font-medium flex items-center gap-1 mt-1">
            Ver Detalhes <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </div>
  );
};

export default LocalCardInPost;
