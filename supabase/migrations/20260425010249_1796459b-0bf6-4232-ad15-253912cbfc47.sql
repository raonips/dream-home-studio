CREATE TABLE IF NOT EXISTS public.tides_cache (
  date_string TEXT PRIMARY KEY,
  tide_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tides_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública tides_cache"
ON public.tides_cache
FOR SELECT
USING (true);
