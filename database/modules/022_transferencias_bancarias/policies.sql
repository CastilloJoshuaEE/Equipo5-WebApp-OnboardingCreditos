ALTER TABLE transferencias_bancarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transferencias_acceso" ON transferencias_bancarias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc 
            WHERE sc.id = transferencias_bancarias.solicitud_id
            AND (sc.solicitante_id::text = auth.uid()::text OR sc.operador_id::text = auth.uid()::text)
        )
    );
-- Permitir a operadores ver todas las transferencias
CREATE POLICY "operadores_ver_transferencias" ON transferencias_bancarias
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND rol = 'operador'
  )
);
