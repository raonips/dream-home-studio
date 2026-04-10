
INSERT INTO storage.buckets (id, name, public)
VALUES ('categorias', 'categorias', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Leitura pública categorias" ON storage.objects FOR SELECT USING (bucket_id = 'categorias');
CREATE POLICY "Upload autenticado categorias" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'categorias' AND auth.role() = 'authenticated');
CREATE POLICY "Delete autenticado categorias" ON storage.objects FOR DELETE USING (bucket_id = 'categorias' AND auth.role() = 'authenticated');
CREATE POLICY "Update autenticado categorias" ON storage.objects FOR UPDATE USING (bucket_id = 'categorias' AND auth.role() = 'authenticated');
