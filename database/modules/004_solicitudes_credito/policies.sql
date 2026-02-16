CREATE POLICY "solicitudes_acceso" ON solicitudes_credito
    FOR ALL USING (
        auth.uid()::text = solicitante_id::text OR
        EXISTS (SELECT 1 FROM operadores WHERE id::text = auth.uid()::text)
    );