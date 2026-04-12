import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Change this to your production domain when published
const BASE_URL = "https://barradojacuipe.com.br";

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
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "xml";

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all data in parallel
    const [propertiesRes, locaisRes, guiaPostsRes, guiaCatsRes, condominiosRes] = await Promise.all([
      supabase.from("properties").select("slug, transaction_type, updated_at").eq("status", "active").not("slug", "is", null),
      supabase.from("locais").select("slug, updated_at").eq("ativo", true),
      supabase.from("guia_posts").select("slug, updated_at").eq("status", "publicado"),
      supabase.from("guia_categorias").select("slug, updated_at"),
      supabase.from("condominios").select("slug, updated_at").not("slug", "is", null),
    ]);

    const properties = propertiesRes.data || [];
    const locais = locaisRes.data || [];
    const guiaPosts = guiaPostsRes.data || [];
    const guiaCats = guiaCatsRes.data || [];
    const condominios = condominiosRes.data || [];

    // JSON stats format for admin panel
    if (format === "json") {
      return new Response(JSON.stringify({
        total: properties.length + locais.length + guiaPosts.length + guiaCats.length + condominios.length + 6,
        properties_venda: properties.filter(p => p.transaction_type !== "temporada").length,
        properties_temporada: properties.filter(p => p.transaction_type === "temporada").length,
        locais: locais.length,
        guia_posts: guiaPosts.length,
        guia_categorias: guiaCats.length,
        condominios: condominios.length,
        static_pages: 6,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build XML sitemap
    const entries: string[] = [];

    // Static pages
    entries.push(urlEntry(`${BASE_URL}/`, undefined, "1.0", "daily"));
    entries.push(urlEntry(`${BASE_URL}/imoveis`, undefined, "0.9", "daily"));
    entries.push(urlEntry(`${BASE_URL}/imoveis/vendas`, undefined, "0.8", "daily"));
    entries.push(urlEntry(`${BASE_URL}/imoveis/temporada`, undefined, "0.8", "daily"));
    entries.push(urlEntry(`${BASE_URL}/imoveis/condominios`, undefined, "0.7", "weekly"));
    entries.push(urlEntry(`${BASE_URL}/mapa`, undefined, "0.6", "weekly"));

    // Properties
    for (const p of properties) {
      const prefix = p.transaction_type === "temporada" ? "temporada" : "venda";
      entries.push(urlEntry(`${BASE_URL}/imoveis/${prefix}/${p.slug}`, p.updated_at, "0.7", "weekly"));
    }

    // Condominios
    for (const c of condominios) {
      entries.push(urlEntry(`${BASE_URL}/imoveis/condominio/${c.slug}`, c.updated_at, "0.6", "weekly"));
    }

    // Locais
    for (const l of locais) {
      entries.push(urlEntry(`${BASE_URL}/locais/${l.slug}`, l.updated_at, "0.6", "weekly"));
    }

    // Guia categories
    for (const cat of guiaCats) {
      entries.push(urlEntry(`${BASE_URL}/guia/categoria/${cat.slug}`, cat.updated_at, "0.6", "weekly"));
    }

    // Guia posts
    for (const post of guiaPosts) {
      entries.push(urlEntry(`${BASE_URL}/${post.slug}`, post.updated_at, "0.7", "weekly"));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
