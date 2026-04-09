CREATE TABLE public.ad_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  heading text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  button_text text NOT NULL DEFAULT 'VER IMÓVEIS DISPONÍVEIS',
  overlay_style text NOT NULL DEFAULT 'oceanic',
  target_category text NOT NULL DEFAULT 'condominio',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública ad_templates" ON public.ad_templates FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam ad_templates" ON public.ad_templates FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');