ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- Políticas simples
CREATE POLICY "usuarios_propio_perfil" ON usuarios
    FOR ALL USING (auth.uid()::text = id::text);
