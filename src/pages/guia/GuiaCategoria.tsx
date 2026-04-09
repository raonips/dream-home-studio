import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SafeImage from "@/components/SafeImage";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

interface GuiaPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  imagem_destaque: string | null;
  published_at: string | null;
}

interface GuiaCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
}

const GuiaCategoriaPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [categoria, setCategoria] = useState<GuiaCategoria | null>(null);
  const [posts, setPosts] = useState<GuiaPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      const { data: cat } = await supabase
        .from("guia_categorias")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (cat) {
        setCategoria(cat);
        const { data: p } = await supabase
          .from("guia_posts")
          .select("id, titulo, slug, resumo, imagem_destaque, published_at")
          .eq("categoria_id", cat.id)
          .eq("status", "publicado")
          .order("published_at", { ascending: false });
        setPosts(p ?? []);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!categoria) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Categoria não encontrada</h1>
        <Link to="/" className="text-primary hover:underline">Voltar ao Guia</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{categoria.nome} — Guia Local Barra do Jacuípe</title>
        {categoria.descricao && <meta name="description" content={categoria.descricao} />}
      </Helmet>

      <div className="pt-24 pb-16">
        <div className="container">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Guia</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{categoria.nome}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-3xl font-bold mb-2">{categoria.nome}</h1>
          {categoria.descricao && (
            <p className="text-muted-foreground mb-8">{categoria.descricao}</p>
          )}

          {posts.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center">
              Nenhum artigo nesta categoria ainda.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.id} to={`/${post.slug}`} className="group">
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                    {post.imagem_destaque && (
                      <div className="aspect-video overflow-hidden">
                        <SafeImage
                          src={post.imagem_destaque}
                          alt={post.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h2 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {post.titulo}
                      </h2>
                      {post.resumo && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.resumo}</p>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium">
                        Ler mais <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GuiaCategoriaPage;
