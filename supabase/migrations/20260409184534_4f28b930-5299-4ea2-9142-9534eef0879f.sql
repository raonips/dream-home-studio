
-- Create locais table
CREATE TABLE public.locais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'utilidade',
  telefone TEXT,
  whatsapp TEXT,
  google_maps_link TEXT,
  imagem_destaque TEXT,
  imagens TEXT[] DEFAULT '{}',
  endereco TEXT,
  horario_funcionamento TEXT,
  website TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Leitura pública locais"
ON public.locais FOR SELECT
USING (true);

-- Authenticated write
CREATE POLICY "Admins inserem locais"
ON public.locais FOR INSERT
TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins editam locais"
ON public.locais FOR UPDATE
TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins deletam locais"
ON public.locais FOR DELETE
TO public
USING (auth.role() = 'authenticated');

-- Index on slug for fast lookups
CREATE INDEX idx_locais_slug ON public.locais (slug);
CREATE INDEX idx_locais_categoria ON public.locais (categoria);
