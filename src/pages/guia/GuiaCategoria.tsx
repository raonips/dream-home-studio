import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ResponsiveImage from "@/components/ResponsiveImage";
import PostContentRenderer from "@/components/PostContentRenderer";
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
  imagem_destaque_mobile: string | null;
  published_at: string | null;
}

interface GuiaCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
}

interface Local {
  id: string;
  nome: string;
  slug: string;
  categoria: string;
  imagem_destaque: string | null;
  imagem_destaque_mobile: string | null;
  endereco: string | null;
}

// Mapeia o slug da categoria do Guia → categorias reais usadas na tabela `locais`
const CATEGORIA_MAPPING: Record<string, string[]> = {
  gastronomia: ["restaurante", "padaria"],
  hospedagem: ["hospedagem"],
  pousada: ["hospedagem"],
  pousadas: ["hospedagem"],
  utilidades: ["utilidade", "gas", "limpeza", "farmacia", "saude", "mercado"],
  condominios: ["condominio"],
  mercados: ["mercado"],
  padarias: ["padaria"],
  restaurantes: ["restaurante"],
  farmacias: ["farmacia"],
  saude: ["saude"],
  gas: ["gas"],
  limpeza: ["limpeza"],
  "produtos-para-piscina": ["limpeza", "utilidade"],
};

// Heurística genérica: se o slug termina em "s", tenta o singular também.
const resolveLocalCategorias = (slug: string): string[] => {
  if (CATEGORIA_MAPPING[slug]) return CATEGORIA_MAPPING[slug];
  if (slug.endsWith("s")) return [slug, slug.slice(0, -1)];
  return [slug];
};

const LOCAL_MARKER_REGEX = /\[LOCAL_CARD:\s*([a-f0-9-]{36})\]/gi;

const GuiaCategoriaPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [categoria, setCategoria] = useState<GuiaCategoria | null>(null);
  const [posts, setPosts] = useState<GuiaPost[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
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

        const dbCategorias = resolveLocalCategorias(slug);
        let locaisQuery = supabase
          .from("locais")
          .select("id,nome,slug,categoria,imagem_destaque,imagem_destaque_mobile,endereco")
          .eq("ativo", true)
          .order("ordem")
          .order("nome");
        if (dbCategorias.length === 1) locaisQuery = locaisQuery.eq("categoria", dbCategorias[0]);
        else locaisQuery = locaisQuery.in("categoria", dbCategorias);

        const [postsRes, locaisRes] = await Promise.all([
          supabase
            .from("guia_posts")
            .select("id, titulo, slug, resumo, imagem_destaque, imagem_destaque_mobile, published_at")
            .eq("categoria_id", cat.id)
            .eq("status", "publicado")
            .order("published_at", { ascending: false }),
          locaisQuery,
        ]);

        setPosts(postsRes.data ?? []);
        setLocais((locaisRes.data as Local[]) ?? []);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  // IDs de locais já mencionados manualmente no rich text — para não duplicar abaixo.
  const featuredIds = useMemo(() => {
    const ids = new Set<string>();
    if (categoria?.descricao) {
      const matches = categoria.descricao.matchAll(LOCAL_MARKER_REGEX);
      for (const m of matches) ids.add(m[1]);
    }
    return ids;
  }, [categoria?.descricao]);

  const locaisAutomaticos = useMemo(
    () => locais.filter((l) => !featuredIds.has(l.id)),
    [locais, featuredIds]
  );

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

  const hasRichDescription = !!categoria.descricao && categoria.descricao.trim().length > 0;

  return (
    <>
      <Helmet>
        <title>{categoria.nome} — Guia Local Barra do Jacuípe</title>
        {categoria.descricao && (
          <meta
            name="description"
            content={categoria.descricao.replace(/<[^>]+>/g, "").replace(LOCAL_MARKER_REGEX, "").slice(0, 160)}
          />
        )}
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

          <h1 className="text-3xl font-bold mb-4">{categoria.nome}</h1>

          {hasRichDescription && (
            <div className="mb-10">
              <PostContentRenderer html={categoria.descricao} />
            </div>
          )}

          {posts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Artigos do Guia</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link key={post.id} to={`/${post.slug}`} className="group">
                    <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                      {post.imagem_destaque && (
                        <div className="aspect-video overflow-hidden">
                          <ResponsiveImage
                            src={post.imagem_destaque}
                            mobileSrc={post.imagem_destaque_mobile}
                            alt={post.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {post.titulo}
                        </h3>
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
            </section>
          )}

          {locaisAutomaticos.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-6 pt-6 border-t">
                <h2 className="text-2xl font-semibold">
                  Todas as opções em {categoria.nome}
                </h2>
                <Badge variant="secondary">{locaisAutomaticos.length}</Badge>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {locaisAutomaticos.map((local) => (
                  <Link key={local.id} to={`/locais/${local.slug}`} className="group">
                    <div className="overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-[var(--shadow-card-hover)] transition-all h-full">
                      <div className="aspect-[16/10] overflow-hidden">
                        <ResponsiveImage
                          src={local.imagem_destaque || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"}
                          mobileSrc={local.imagem_destaque_mobile}
                          alt={local.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{local.nome}</h3>
                        {local.endereco && (
                          <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="line-clamp-1">{local.endereco}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {posts.length === 0 && locaisAutomaticos.length === 0 && !hasRichDescription && (
            <p className="text-muted-foreground py-12 text-center">
              Nenhum conteúdo nesta categoria ainda.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default GuiaCategoriaPage;
