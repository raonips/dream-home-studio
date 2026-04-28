import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import SafeHtmlContent from "@/components/SafeHtmlContent";
import { Loader2 } from "lucide-react";

interface DestinationPageData {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

const DestinationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<DestinationPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    supabase
      .from("destination_pages")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setPage(data as DestinationPageData);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center pt-20 px-4 text-center">
        <h1 className="text-3xl font-bold mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground mb-6">A página que você procura não existe ou foi removida.</p>
        <Link to="/" className="text-primary hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{page.seo_title || `${page.title} | Barra do Jacuípe`}</title>
        {page.seo_description && <meta name="description" content={page.seo_description} />}
      </Helmet>

      {/* Hero */}
      <section
        className="relative w-full h-[55vh] min-h-[360px] md:h-[70vh] flex items-center justify-center text-center pt-16"
        style={
          page.hero_image_url
            ? {
                backgroundImage: `url(${page.hero_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        <div className="relative z-10 container px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg max-w-4xl mx-auto leading-tight">
            {page.title}
          </h1>
        </div>
      </section>

      {/* Conteúdo */}
      <article className="container max-w-3xl mx-auto px-4 py-12 md:py-16">
        <SafeHtmlContent html={page.content} className="mx-auto" />
      </article>
    </>
  );
};

export default DestinationPage;
