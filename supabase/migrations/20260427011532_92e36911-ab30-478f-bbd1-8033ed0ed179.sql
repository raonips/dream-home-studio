-- Tabela para rotas customizadas/manuais com SEO próprio (ex: /tabua-de-mares/imbassai)
CREATE TABLE public.seo_custom_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url_path text NOT NULL UNIQUE,
  title text,
  description text,
  keywords text,
  is_indexed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_custom_routes ENABLE ROW LEVEL SECURITY;

-- Leitura pública (necessário para sitemap e front)
CREATE POLICY "Leitura pública seo_custom_routes"
ON public.seo_custom_routes
FOR SELECT
USING (true);

-- Apenas autenticados gerenciam
CREATE POLICY "Admins gerenciam seo_custom_routes"
ON public.seo_custom_routes
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_seo_custom_routes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seo_custom_routes_updated_at
BEFORE UPDATE ON public.seo_custom_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_seo_custom_routes_updated_at();

CREATE INDEX idx_seo_custom_routes_url_path ON public.seo_custom_routes(url_path);