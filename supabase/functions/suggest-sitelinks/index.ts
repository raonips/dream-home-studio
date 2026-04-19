// Edge Function: suggest-sitelinks
// Uses Lovable AI Gateway to suggest 4 sitelinks for a given page based on title/description.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept, cache-control, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { path, title, description, label } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um especialista em SEO para o portal "Barra do Jacuípe" (imóveis e guia local na Bahia, Brasil).
Sua tarefa é sugerir 4 SITELINKS (sub-links) que apareceriam no Google abaixo do resultado principal de uma página.
Os sitelinks devem ser seções/sub-páginas relevantes E PROVÁVEIS dentro do mesmo domínio.
Gere títulos curtos (2-4 palavras), em português, e URLs RELATIVAS plausíveis começando com "/".
Considere o contexto: rotas como /imoveis, /imoveis/vendas, /imoveis/temporada, /imoveis/condominios, /locais/<slug>, /guia/categoria/<slug>, /mapa, /imoveis/contato, /busca etc.`;

    const userPrompt = `Página atual:
- URL: ${path}
- Rótulo: ${label || "(sem rótulo)"}
- Título: ${title || "(sem título)"}
- Descrição: ${description || "(sem descrição)"}

Gere 4 sitelinks relevantes para essa página específica.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_sitelinks",
              description: "Return exactly 4 sitelink suggestions",
              parameters: {
                type: "object",
                properties: {
                  sitelinks: {
                    type: "array",
                    minItems: 4,
                    maxItems: 4,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título curto (2-4 palavras) em português" },
                        url: { type: "string", description: "URL relativa começando com /" },
                      },
                      required: ["title", "url"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["sitelinks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_sitelinks" } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha ao chamar IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const sitelinks = (parsed?.sitelinks || []).slice(0, 4).map((s: any) => ({
      title: String(s.title || "").slice(0, 40),
      url: String(s.url || "/").startsWith("/") ? s.url : `/${s.url}`,
    }));

    return new Response(JSON.stringify({ sitelinks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    console.error("suggest-sitelinks error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
