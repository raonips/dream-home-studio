ALTER TABLE public.ad_templates
  ADD COLUMN layout_model text NOT NULL DEFAULT 'full_banner',
  ADD COLUMN custom_html text NOT NULL DEFAULT '';