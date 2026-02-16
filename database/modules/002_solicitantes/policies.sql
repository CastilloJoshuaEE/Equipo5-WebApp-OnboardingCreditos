ALTER TABLE solicitantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solicitantes_propios_datos" ON solicitantes
    FOR ALL USING (auth.uid()::text = id::text);
    