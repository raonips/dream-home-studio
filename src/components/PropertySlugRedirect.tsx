import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PropertySlugRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const [target, setTarget] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!slug) { setChecked(true); return; }
    supabase
      .from("properties")
      .select("slug, transaction_type")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const prefix = data.transaction_type === "temporada" ? "temporada" : "venda";
          setTarget(`/imoveis/${prefix}/${data.slug}`);
        }
        setChecked(true);
      });
  }, [slug]);

  if (!checked) return null;
  if (target) return <Navigate to={target} replace />;
  // Not a property — let it 404
  return <Navigate to="/404" replace />;
};

export default PropertySlugRedirect;
