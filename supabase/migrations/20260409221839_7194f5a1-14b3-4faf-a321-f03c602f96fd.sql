ALTER TABLE public.locais
  ADD COLUMN IF NOT EXISTS url_vendas text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banner_publicidade text DEFAULT NULL;