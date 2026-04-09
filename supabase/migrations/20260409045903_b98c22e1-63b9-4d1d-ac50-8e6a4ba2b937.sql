
-- Guia Local: Categorias
CREATE TABLE public.guia_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.guia_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública guia_categorias" ON public.guia_categorias FOR SELECT USING (true);
CREATE POLICY "Admins inserem guia_categorias" ON public.guia_categorias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins editam guia_categorias" ON public.guia_categorias FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins deletam guia_categorias" ON public.guia_categorias FOR DELETE USING (auth.role() = 'authenticated');

-- Guia Local: Posts
CREATE TABLE public.guia_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  resumo TEXT,
  conteudo TEXT,
  imagem_destaque TEXT,
  categoria_id UUID REFERENCES public.guia_categorias(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  autor TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  published_at TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.guia_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública guia_posts publicados" ON public.guia_posts FOR SELECT USING (true);
CREATE POLICY "Admins inserem guia_posts" ON public.guia_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins editam guia_posts" ON public.guia_posts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins deletam guia_posts" ON public.guia_posts FOR DELETE USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_guia_posts_slug ON public.guia_posts(slug);
CREATE INDEX idx_guia_posts_categoria ON public.guia_posts(categoria_id);
CREATE INDEX idx_guia_posts_status ON public.guia_posts(status);
CREATE INDEX idx_guia_categorias_slug ON public.guia_categorias(slug);
