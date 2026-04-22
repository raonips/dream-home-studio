CREATE TABLE public.url_redirects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  old_path TEXT NOT NULL UNIQUE,
  new_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_url_redirects_old_path ON public.url_redirects(old_path) WHERE is_active = true;

ALTER TABLE public.url_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública url_redirects"
ON public.url_redirects FOR SELECT
USING (true);

CREATE POLICY "Admins gerenciam url_redirects"
ON public.url_redirects FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');