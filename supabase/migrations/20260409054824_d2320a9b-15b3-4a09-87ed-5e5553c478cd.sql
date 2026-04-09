
CREATE TABLE public.guia_site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text DEFAULT 'Barra do Jacuípe',
  site_title text,
  site_description text,
  site_keywords text,
  og_image_url text,
  head_scripts text,
  body_scripts text,
  favicon_url text,
  logo_url text,
  header_logo_url text,
  hero_image_url text,
  hero_bg_desktop text,
  hero_bg_mobile text,
  hero_desktop_low text NOT NULL DEFAULT '',
  hero_mobile_low text NOT NULL DEFAULT '',
  hero_title text,
  hero_subtitle text,
  primary_color text DEFAULT '#e97316',
  contact_email text,
  contact_phone text,
  address text,
  facebook_url text,
  instagram_url text,
  youtube_url text,
  whatsapp_number text NOT NULL DEFAULT '',
  map_provider text DEFAULT 'leaflet',
  google_maps_api_key text,
  watermark_url text,
  watermark_position text DEFAULT 'Centralizado',
  watermark_opacity numeric DEFAULT 50,
  watermark_scale numeric DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.guia_site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura Publica" ON public.guia_site_settings FOR SELECT USING (true);
CREATE POLICY "Edicao Admin" ON public.guia_site_settings FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Seed with one default row
INSERT INTO public.guia_site_settings (site_title, site_description, hero_title, hero_subtitle)
VALUES (
  'Barra do Jacuípe | Guia Local do Litoral Norte',
  'Descubra praias, restaurantes, passeios e dicas sobre Barra do Jacuípe, Litoral Norte da Bahia.',
  'Guia Local de Barra do Jacuípe',
  'Praias, restaurantes, passeios e tudo sobre o Litoral Norte baiano.'
);
