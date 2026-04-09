import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SafeImage from "@/components/SafeImage";

interface GuiaPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  imagem_destaque: string | null;
  published_at: string | null;
  categoria_id: string | null;
  tags: string[];
}

interface GuiaCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  icone: string | null;
}

const GuiaHome = () => {
  const [posts, setPosts] = useState<GuiaPost[]>([]);
  const [categorias, setCategorias] = useState<GuiaCategoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [postsRes, catRes] = await Promise.all([
        supabase
          .from("guia_posts")
          .select("id, titulo, slug, resumo, imagem_destaque, published_at, categoria_id, tags")
          .eq("status", "publicado")
          .order("published_at", { ascending: false })
          .limit(20),
        supabase
          .from("guia_categorias")
          .select("*")
          .order("ordem", { ascending: true }),
      ]);
      setPosts(postsRes.data ?? []);
      setCategorias(catRes.data ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getCategoriaName = (id: string | null) =>
    categorias.find((c) => c.id === id)?.nome ?? "";

  return (
    <>
      <Helmet>
        <title>Guia Local - Barra do Jacuípe | Praias, Restaurantes e Dicas</title>
        <meta
          name="description"
          content="Descubra o melhor da Barra do Jacuípe: praias, restaurantes, passeios, dicas de turismo e informações locais. Seu guia completo para aproveitar a região."
        />
        <meta name="keywords" content="Barra do Jacuípe, guia local, praias, restaurantes, turismo, dicas" />
      </Helmet>

      <section className="pt-24 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Guia Local — Barra do Jacuípe
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tudo o que você precisa saber sobre a região: praias, restaurantes, passeios e muito mais.
          </p>
        </div>
      </section>

      {/* Categorias */}
      {categorias.length > 0 && (
        <section className="py-8">
          <div className="container">
            <div className="flex flex-wrap gap-3 justify-center">
              {categorias.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/guia/categoria/${cat.slug}`}
                  className="px-4 py-2 rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-sm font-medium"
                >
                  {cat.icone && <span className="mr-1">{cat.icone}</span>}
                  {cat.nome}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Posts */}
      <section className="py-8 pb-16">
        <div className="container">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">
              Nenhum artigo publicado ainda. Volte em breve!
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
                      {post.categoria_id && (
                        <Badge variant="secondary" className="mb-2 text-xs">
                          {getCategoriaName(post.categoria_id)}
                        </Badge>
                      )}
                      <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.titulo}
                      </h2>
                      {post.resumo && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {post.resumo}
                        </p>
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
      </section>

      {/* CTA Imóveis */}
      <section className="py-12 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-3">Procurando imóveis na região?</h2>
          <p className="text-muted-foreground mb-6">
            Confira nosso portfólio de casas, apartamentos e terrenos à venda e para temporada.
          </p>
          <Link
            to="/imoveis"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Ver Imóveis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
};

export default GuiaHome;
