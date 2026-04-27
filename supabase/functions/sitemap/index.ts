import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept, cache-control, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BASE_URL = "https://barradojacuipe.com.br";

function normalizePath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "/";

  let pathname = trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      pathname = trimmed;
    }
  }

  pathname = pathname.split("#")[0]?.split("?")[0] || "/";

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  pathname = pathname.replace(/\/{2,}/g, "/");

  if (pathname.length > 1) {
    pathname = pathname.replace(/\/+$/, "");
  }

  return pathname || "/";
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod?: string, priority = "0.5", changefreq = "weekly"): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod.substring(0, 10)}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const requestedFormat = url.searchParams.get("format");
  const acceptHeader = req.headers.get("accept") || "";
  const clientInfo = req.headers.get("x-client-info") || "";
  const isSupabaseClientRequest = clientInfo.includes("supabase-js");
  const format = requestedFormat || (acceptHeader.includes("application/json") || isSupabaseClientRequest ? "json" : "xml");

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all data in parallel, including noindex overrides + custom routes
    const [propertiesRes, locaisRes, guiaPostsRes, guiaCatsRes, condominiosRes, noindexRes, customRoutesRes] = await Promise.all([
      supabase.from("properties").select("slug, transaction_type, updated_at").eq("status", "active").not("slug", "is", null),
      supabase.from("locais").select("slug, updated_at").eq("ativo", true),
      supabase.from("guia_posts").select("slug, updated_at").eq("status", "publicado"),
      supabase.from("guia_categorias").select("slug, updated_at"),
      supabase.from("condominios").select("slug, updated_at").not("slug", "is", null),
      supabase.from("seo_overrides").select("page_path").eq("is_indexed", false),
      supabase.from("seo_custom_routes").select("url_path, updated_at").eq("is_indexed", true),
    ]);

    const properties = propertiesRes.data || [];
    const locais = locaisRes.data || [];
    const guiaPosts = guiaPostsRes.data || [];
    const guiaCats = guiaCatsRes.data || [];
    const condominios = condominiosRes.data || [];
    const customRoutes = customRoutesRes.data || [];

    // Build set of noindex paths
    const noindexPaths = new Set((noindexRes.data || []).map((r: any) => normalizePath(r.page_path)));

    // Helper: only add if not noindex
    const addIfIndexed = (entries: string[], path: string, lastmod?: string, priority = "0.5", changefreq = "weekly") => {
      const normalizedPath = normalizePath(path);
      if (noindexPaths.has(normalizedPath)) return false;
      entries.push(urlEntry(`${BASE_URL}${normalizedPath}`, lastmod, priority, changefreq));
      return true;
    };

    // Build XML sitemap
    const entries: string[] = [];
    const stats = {
      properties_venda: 0,
      properties_temporada: 0,
      locais: 0,
      guia_posts: 0,
      guia_categorias: 0,
      condominios: 0,
      static_pages: 0,
      custom_routes: 0,
    };

    // Static pages
    if (addIfIndexed(entries, "/", undefined, "1.0", "daily")) stats.static_pages += 1;
    if (addIfIndexed(entries, "/imoveis", undefined, "0.9", "daily")) stats.static_pages += 1;
    if (addIfIndexed(entries, "/imoveis/vendas", undefined, "0.8", "daily")) stats.static_pages += 1;
    if (addIfIndexed(entries, "/imoveis/temporada", undefined, "0.8", "daily")) stats.static_pages += 1;
    if (addIfIndexed(entries, "/imoveis/condominios", undefined, "0.7", "weekly")) stats.static_pages += 1;
    if (addIfIndexed(entries, "/mapa", undefined, "0.6", "weekly")) stats.static_pages += 1;

    // Properties
    for (const p of properties) {
      const prefix = p.transaction_type === "temporada" ? "temporada" : "venda";
      if (addIfIndexed(entries, `/imoveis/${prefix}/${p.slug}`, p.updated_at, "0.7", "weekly")) {
        if (p.transaction_type === "temporada") {
          stats.properties_temporada += 1;
        } else {
          stats.properties_venda += 1;
        }
      }
    }

    // Condominios
    for (const c of condominios) {
      if (addIfIndexed(entries, `/imoveis/condominio/${c.slug}`, c.updated_at, "0.6", "weekly")) {
        stats.condominios += 1;
      }
    }

    // Locais
    for (const l of locais) {
      if (addIfIndexed(entries, `/locais/${l.slug}`, l.updated_at, "0.6", "weekly")) {
        stats.locais += 1;
      }
    }

    // Guia categories
    for (const cat of guiaCats) {
      if (addIfIndexed(entries, `/guia/categoria/${cat.slug}`, cat.updated_at, "0.6", "weekly")) {
        stats.guia_categorias += 1;
      }
    }

    // Guia posts
    for (const post of guiaPosts) {
      if (addIfIndexed(entries, `/${post.slug}`, post.updated_at, "0.7", "weekly")) {
        stats.guia_posts += 1;
      }
    }

    // Custom routes (manual SEO entries — e.g. /tabua-de-mares/imbassai)
    for (const cr of customRoutes) {
      if (addIfIndexed(entries, cr.url_path, cr.updated_at, "0.8", "weekly")) {
        stats.custom_routes += 1;
      }
    }

    const total = stats.properties_venda
      + stats.properties_temporada
      + stats.locais
      + stats.guia_posts
      + stats.guia_categorias
      + stats.condominios
      + stats.static_pages
      + stats.custom_routes;

    // JSON stats format for admin panel
    if (format === "json") {
      return new Response(JSON.stringify({
        total,
        ...stats,
        noindex: noindexPaths.size,
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
