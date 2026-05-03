# Bot Interceptor — Prerender SEO para WhatsApp/Facebook/Twitter

Esta pasta contém o **Cloudflare Worker** que intercepta crawlers sociais e devolve HTML com as Open Graph tags corretas para cada rota.

## Arquitetura

```
WhatsApp/Facebook/Bot  ──►  Cloudflare Worker  ──►  Edge Function "prerender" (Supabase)
                                   │                            │
                                   │                            └─► Consulta seo_overrides,
                                   │                                properties, condominios,
                                   │                                guia_posts, locais, etc.
                                   ▼
                              HTML estático com og:title/description/image dinâmicos


Humano (browser) ──► Cloudflare Worker ──► Lovable (SPA index.html) ──► React assume
```

## Passo a passo (uma vez só)

### 1. Pré-requisitos
- Domínio `barradojacuipe.com.br` apontado para a Cloudflare (nameservers da Cloudflare).
- Site da Lovable já publicado e o domínio custom conectado em **Lovable → Project Settings → Domains**.

### 2. Criar o Worker
1. Acesse **https://dash.cloudflare.com** → escolha sua conta.
2. Menu lateral: **Workers & Pages** → **Create** → **Create Worker** → dê um nome (ex.: `bot-interceptor`).
3. Clique em **Edit code**.
4. Apague o código padrão e cole **todo o conteúdo de `bot-interceptor.js`** (este diretório).
5. Clique em **Deploy**.

### 3. Conectar o Worker ao domínio
1. Na barra superior do Dashboard, selecione a zona `barradojacuipe.com.br`.
2. Menu lateral: **Workers Routes** → **Add route**.
3. Crie duas rotas, ambas apontando para o Worker `bot-interceptor`:
   - `barradojacuipe.com.br/*`
   - `www.barradojacuipe.com.br/*`
4. Em **DNS**, garanta que o registro do domínio esteja com a **nuvem laranja (Proxied)** ligada.

### 4. Testar
No terminal:

```bash
# Simulando o WhatsApp
curl -A "WhatsApp/2.23" https://barradojacuipe.com.br/imoveis/venda/SEU-SLUG-REAL

# Deve aparecer:
#   <meta property="og:title" content="Título real do imóvel" />
#   <meta property="og:description" content="..." />
#   <meta property="og:image" content="https://nfzkreaylakmvlrbbjci.supabase.co/storage/..." />
```

Para testar humano:
```bash
curl -A "Mozilla/5.0" https://barradojacuipe.com.br/  # devolve o index.html da SPA normal
```

Validador oficial do Facebook (limpa o cache do WhatsApp também):
**https://developers.facebook.com/tools/debug/** → cole a URL → "Scrape Again".

## O que é prerenderizado

| Rota                                | Fonte de dados              |
|-------------------------------------|-----------------------------|
| Qualquer rota com override no SEO PRO | `seo_overrides` (prioridade) |
| `/imoveis/venda/:slug`              | `properties`                |
| `/imoveis/temporada/:slug`          | `properties`                |
| `/imoveis/imovel/:id`               | `properties`                |
| `/imoveis/condominio/:slug`         | `condominios`               |
| `/locais/:slug`                     | `locais`                    |
| `/destino/:slug`                    | `destination_pages`         |
| `/guia/categoria/:slug`             | `guia_categorias`           |
| `/:slug` (post do guia)             | `guia_posts`                |

## Otimização de imagem
A `og:image` passa pelo endpoint **Storage Render** do Supabase com `width=1200&quality=70`, garantindo arquivos bem abaixo de 300 KB e formato compatível com WhatsApp.

## Manutenção
- Para ajustar lógica de rotas/fontes: editar `supabase/functions/prerender/index.ts` (deploy automático pela Lovable).
- Para ajustar a lista de bots: editar `BOT_REGEX` no Worker e re-deployar pela UI da Cloudflare.
