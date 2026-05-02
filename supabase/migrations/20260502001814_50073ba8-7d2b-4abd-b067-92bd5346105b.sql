ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS radar_preco_alvo numeric,
  ADD COLUMN IF NOT EXISTS radar_quartos_min numeric,
  ADD COLUMN IF NOT EXISTS radar_condominio text;