/**
 * Cloudflare Worker — Bot Interceptor para Barra do Jacuípe
 *
 * Como usar:
 *   1. Acesse https://dash.cloudflare.com → Workers & Pages → Create → Hello World
 *   2. Cole TODO este arquivo no editor do Worker e clique em "Save and Deploy"
 *   3. Vá em Workers Routes (na zona do seu domínio) e adicione:
 *         barradojacuipe.com.br/*       → este Worker
 *         www.barradojacuipe.com.br/*   → este Worker
 *   4. Garanta que o DNS do domínio aponte para a Lovable (registro CNAME já existente)
 *      e que o registro esteja com nuvem laranja (Proxied) ativada.
 *   5. Pronto. Bots recebem HTML com OG tags dinâmicas; humanos vão direto para a SPA.
 *
 * Teste rápido:
 *   curl -A "WhatsApp/2.23" https://barradojacuipe.com.br/imoveis/venda/algum-slug
 *   → deve retornar HTML com <meta property="og:title"> preenchido.
 */

const PRERENDER_ENDPOINT =
  "https://nfzkreaylakmvlrbbjci.supabase.co/functions/v1/prerender";

const BOT_REGEX = /(facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|pinterest|googlebot|bingbot|yandex|duckduckbot|baiduspider|embedly|quora link preview|outbrain|vkshare|w3c_validator|redditbot|applebot|skypeuripreview|nuzzel|bitlybot|tumblr|flipboard|google-inspectiontool|google-structured-data|chatgpt|gptbot|perplexitybot|claudebot|anthropic|metainspector)/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = request.headers.get("User-Agent") || "";

    // Static assets and non-GET requests always pass through.
    const isAsset =
      /\.[a-z0-9]{2,5}(?:$|\?)/i.test(url.pathname) &&
      !url.pathname.endsWith(".html");

    if (request.method !== "GET" || isAsset || !BOT_REGEX.test(ua)) {
      return fetch(request);
    }

    // Bot detected — fetch dynamic OG tags from the prerender Edge Function.
    try {
      const prerenderUrl = `${PRERENDER_ENDPOINT}?path=${encodeURIComponent(
        url.pathname,
      )}`;
      const response = await fetch(prerenderUrl, {
        headers: { "User-Agent": ua },
        cf: { cacheTtl: 300, cacheEverything: true },
      });

      if (!response.ok) {
        return fetch(request);
      }

      const html = await response.text();
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "X-Prerendered": "true",
        },
      });
    } catch (err) {
      // On any failure, fall back to the SPA so we never break crawlers.
      return fetch(request);
    }
  },
};
