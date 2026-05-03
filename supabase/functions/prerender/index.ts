// Prerender edge function — returns static HTML with dynamic OG tags for social crawlers.
// Called by a Cloudflare Worker (or other proxy) sitting in front of the Lovable-hosted SPA.
// The Worker should detect bot User-Agents and forward to:
//   https://<project-ref>.supabase.co/functions/v1/prerender?path=/some/route
// For human traffic, the Worker passes through to the SPA's index.html unchanged.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "public, max-age=300, s-maxage=300",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Default site origin for absolute URLs in OG tags. Override via PUBLIC_SITE_ORIGIN secret if needed.
const SITE_ORIGIN =
  Deno.env.get("PUBLIC_SITE_ORIGIN") || "https://barradojacuipe.com.br";

const FALLBACK = {
  title: "Barra do Jacuípe | Guia Local e Imóveis de Alto Padrão",
  description: "O portal completo de Barra do Jacuípe, BA.",
  image: `${SITE_ORIGIN}/placeholder.svg`,
};

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const absolutize = (url: string | null | undefined) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${SITE_ORIGIN}${url}`;
  return `${SITE_ORIGIN}/${url}`;
};

// Supabase Storage transform — keeps og:image well below 300KB and forces JPEG.
// Works for any image hosted in this project's Storage; passes through external URLs.
const optimizeOgImage = (url: string | null | undefined): string | null => {
  const abs = absolutize(url);
  if (!abs) return null;
  // Only transform Supabase Storage URLs from the connected project.
  const storageMatch = abs.match(
    /^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/(.+)$/i,
  );
  if (!storageMatch) return abs;
  const [, host, rest] = storageMatch;
  // Render endpoint with width/quality parameters.
  return `${host}/storage/v1/render/image/public/${rest}?width=1200&quality=70&resize=cover`;
};

const normalizePath = (input: string): string => {
  let p = (input || "/").trim();
  p = p.split("#")[0]?.split("?")[0] || "/";
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
};

interface Meta {
  title: string;
  description: string;
  image: string;
  canonical: string;
  type?: string;
  noindex?: boolean;
}

async function resolveMeta(path: string): Promise<Meta> {
  const canonical = `${SITE_ORIGIN}${path}`;

  // 1) seo_overrides — highest priority for any route.
  try {
    const { data: override } = await supabase
      .from("seo_overrides")
      .select("seo_title, seo_description, og_image, is_indexed")
      .in("page_path", [path, path === "/" ? "/" : `${path}/`])
      .maybeSingle();
    if (override && (override.seo_title || override.seo_description || override.og_image)) {
      return {
        title: override.seo_title || FALLBACK.title,
        description: override.seo_description || FALLBACK.description,
        image: optimizeOgImage(override.og_image) || FALLBACK.image,
        canonical,
        type: "website",
        noindex: override.is_indexed === false,
      };
    }
  } catch (_) { /* ignore */ }

  // 2) Route-specific lookups.
  const segs = path.split("/").filter(Boolean);

  // /imoveis/venda/:slug | /imoveis/temporada/:slug
  if (segs[0] === "imoveis" && (segs[1] === "venda" || segs[1] === "temporada") && segs[2]) {
    const { data } = await supabase
      .from("properties")
      .select("title, seo_title, seo_description, description, featured_image, image_url, thumbnail_url")
      .eq("slug", segs[2])
      .maybeSingle();
    if (data) {
      return {
        title: data.seo_title || data.title || FALLBACK.title,
        description: data.seo_description || (data.description ? String(data.description).slice(0, 160) : FALLBACK.description),
        image: optimizeOgImage(data.featured_image || data.image_url || data.thumbnail_url) || FALLBACK.image,
        canonical,
        type: "article",
      };
    }
  }

  // /imoveis/imovel/:id
  if (segs[0] === "imoveis" && segs[1] === "imovel" && segs[2]) {
    const { data } = await supabase
      .from("properties")
      .select("title, seo_title, seo_description, description, featured_image, image_url, thumbnail_url")
      .eq("id", segs[2])
      .maybeSingle();
    if (data) {
      return {
        title: data.seo_title || data.title || FALLBACK.title,
        description: data.seo_description || (data.description ? String(data.description).slice(0, 160) : FALLBACK.description),
        image: optimizeOgImage(data.featured_image || data.image_url || data.thumbnail_url) || FALLBACK.image,
        canonical,
        type: "article",
      };
    }
  }

  // /imoveis/condominio/:slug
  if (segs[0] === "imoveis" && segs[1] === "condominio" && segs[2]) {
    const { data } = await supabase
      .from("condominios")
      .select("name, seo_title, seo_description, description, featured_image, hero_image, thumbnail_url")
      .eq("slug", segs[2])
      .maybeSingle();
    if (data) {
      return {
        title: data.seo_title || data.name || FALLBACK.title,
        description: data.seo_description || (data.description ? String(data.description).slice(0, 160) : FALLBACK.description),
        image: optimizeOgImage(data.featured_image || data.hero_image || data.thumbnail_url) || FALLBACK.image,
        canonical,
        type: "website",
      };
    }
  }

  // /locais/:slug  (excluding category listings handled by SPA)
  if (segs[0] === "locais" && segs[1] && !["gastronomia", "hospedagem", "utilidades", "condominios"].includes(segs[1])) {
    const { data } = await supabase
      .from("locais")
      .select("nome, seo_title, seo_description, descricao, imagem_destaque")
      .eq("slug", segs[1])
      .maybeSingle();
    if (data) {
      return {
        title: data.seo_title || data.nome || FALLBACK.title,
        description: data.seo_description || (data.descricao ? String(data.descricao).slice(0, 160) : FALLBACK.description),
        image: optimizeOgImage(data.imagem_destaque) || FALLBACK.image,
        canonical,
        type: "website",
      };
    }
  }

  // /destino/:slug
  if (segs[0] === "destino" && segs[1]) {
    const { data } = await supabase
      .from("destination_pages")
      .select("title, seo_title, seo_description, hero_image_url")
      .eq("slug", segs[1])
      .maybeSingle();
    if (data) {
      return {
        title: data.seo_title || data.title || FALLBACK.title,
        description: data.seo_description || FALLBACK.description,
        image: optimizeOgImage(data.hero_image_url) || FALLBACK.image,
        canonical,
        type: "website",
      };
    }
  }

  // /guia/categoria/:slug
  if (segs[0] === "guia" && segs[1] === "categoria" && segs[2]) {
    const { data } = await supabase
      .from("guia_categorias")
      .select("nome, descricao, imagem")
      .eq("slug", segs[2])
      .maybeSingle();
    if (data) {
      return {
        title: `${data.nome} | Guia Barra do Jacuípe`,
        description: data.descricao || FALLBACK.description,
        image: optimizeOgImage(data.imagem) || FALLBACK.image,
        canonical,
        type: "website",
      };
    }
  }

  // /:slug — guia_posts catch-all (only single-segment, non-reserved paths)
  const RESERVED = new Set([
    "imoveis", "guia", "locais", "destino", "busca", "mapa",
    "tabua-de-mares", "qr", "admin", "login", "contato", "",
  ]);
  if (segs.length === 1 && !RESERVED.has(segs[0])) {
    const { data } = await supabase
      .from("guia_posts")
      .select("titulo, seo_title, seo_description, resumo, imagem_destaque, status")
      .eq("slug", segs[0])
      .maybeSingle();
    if (data && data.status !== "rascunho") {
      return {
        title: data.seo_title || data.titulo || FALLBACK.title,
        description: data.seo_description || data.resumo || FALLBACK.description,
        image: optimizeOgImage(data.imagem_destaque) || FALLBACK.image,
        canonical,
        type: "article",
      };
    }
  }

  return { ...FALLBACK, canonical, type: "website" };
}

function renderHtml(meta: Meta): string {
  const title = escapeHtml(meta.title);
  const desc = escapeHtml(meta.description);
  const image = escapeHtml(meta.image);
  const canonical = escapeHtml(meta.canonical);
  const type = escapeHtml(meta.type || "website");
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow";

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${desc}" />
<meta name="robots" content="${robots}" />
<link rel="canonical" href="${canonical}" />

<meta property="og:type" content="${type}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${canonical}" />
<meta property="og:site_name" content="Barra do Jacuípe" />
<meta property="og:locale" content="pt_BR" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${image}" />
</head>
<body>
<h1>${title}</h1>
<p>${desc}</p>
<p><a href="${canonical}">${canonical}</a></p>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = normalizePath(url.searchParams.get("path") || "/");
    const meta = await resolveMeta(path);
    const html = renderHtml(meta);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("[prerender] error:", err);
    const html = renderHtml({
      ...FALLBACK,
      canonical: SITE_ORIGIN,
      type: "website",
    });
    return new Response(html, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
