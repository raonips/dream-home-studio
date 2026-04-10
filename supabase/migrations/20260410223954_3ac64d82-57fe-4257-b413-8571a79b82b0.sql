
CREATE TABLE public.placas_qr (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_placa text NOT NULL UNIQUE,
  imovel_vinculado_id uuid REFERENCES public.properties(id) ON DELETE SET NULL DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.placas_qr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública placas_qr" ON public.placas_qr FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam placas_qr" ON public.placas_qr FOR ALL TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
