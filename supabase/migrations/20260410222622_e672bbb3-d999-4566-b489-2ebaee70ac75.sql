ALTER TABLE public.locais
ADD COLUMN cupom_desconto text DEFAULT NULL,
ADD COLUMN valor_desconto text DEFAULT NULL;