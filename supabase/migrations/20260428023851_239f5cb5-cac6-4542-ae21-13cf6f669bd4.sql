CREATE TABLE public.destination_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text,
  hero_image_url text,
  seo_title text,
  seo_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.destination_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública destination_pages"
  ON public.destination_pages FOR SELECT
  USING (true);

CREATE POLICY "Admins gerenciam destination_pages"
  ON public.destination_pages FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.update_destination_pages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_destination_pages_updated_at
  BEFORE UPDATE ON public.destination_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_destination_pages_updated_at();

INSERT INTO public.destination_pages (slug, title, content) VALUES
  ('praias', 'Praias de Barra do Jacuípe', '<p>Conteúdo em breve.</p>'),
  ('rio-jacuipe', 'Rio Jacuípe', '<p>Conteúdo em breve.</p>'),
  ('historia', 'História de Barra do Jacuípe', '<p>Conteúdo em breve.</p>');