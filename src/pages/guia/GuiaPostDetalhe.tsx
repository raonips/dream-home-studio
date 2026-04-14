import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import SafeImage from "@/components/SafeImage";
import ResponsiveImage from "@/components/ResponsiveImage";
import PostContentRenderer from "@/components/PostContentRenderer";

interface GuiaPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo: string | null;
  imagem_destaque: string | null;
  imagem_destaque_mobile: string | null;
  published_at: string | null;
  tags: string[];
  autor: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  categoria_id: string | null;
}

interface GuiaCategoria {
  id: string;
  nome: string;
  slug: string;
}

const GuiaPostDetalhe = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<GuiaPost | null>(null);
  const [categoria, setCategoria] = useState<GuiaCategoria | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      const { data } = await supabase
        .from("guia_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "publicado")
        .maybeSingle();

      if (data) {
        setPost(data as GuiaPost);
        if (data.categoria_id) {
          const { data: cat } = await supabase
            .from("guia_categorias")
            .select("id, nome, slug")
            .eq("id", data.categoria_id)
            .maybeSingle();
          setCategoria(cat);
        }
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Artigo não encontrado</h1>
        <Link to="/" className="text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Guia
        </Link>
      </div>
    );
  }

  const pageTitle = post.seo_title || post.titulo;
  const pageDescription = post.seo_description || post.resumo || "";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {pageDescription && <meta name="description" content={pageDescription} />}
        {post.seo_keywords && <meta name="keywords" content={post.seo_keywords} />}
        <meta property="og:title" content={pageTitle} />
        {pageDescription && <meta property="og:description" content={pageDescription} />}
        {post.imagem_destaque && <meta property="og:image" content={post.imagem_destaque} />}
        <link rel="canonical" href={`${window.location.origin}/${post.slug}`} />
      </Helmet>

      <article className="pt-24 pb-16">
        <div className="container max-w-3xl">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Guia</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {categoria && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/guia/categoria/${categoria.slug}`}>{categoria.nome}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{post.titulo}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <header className="mb-8">
            {categoria && (
              <Badge variant="secondary" className="mb-3">{categoria.nome}</Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{post.titulo}</h1>
            {post.resumo && (
              <p className="text-lg text-muted-foreground">{post.resumo}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {post.autor && <span>Por {post.autor}</span>}
              {post.published_at && (
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString("pt-BR", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </time>
              )}
            </div>
          </header>

          {/* Featured image */}
          {post.imagem_destaque && (
            <div className="rounded-xl overflow-hidden mb-8">
              <ResponsiveImage
                src={post.imagem_destaque}
                mobileSrc={post.imagem_destaque_mobile}
                alt={post.titulo}
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          {/* Content */}
          {post.conteudo && (
            <PostContentRenderer
              html={post.conteudo}
              className="max-w-none dark:prose-invert"
            />
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    </>
  );
};

export default GuiaPostDetalhe;
