-- Política RLS
ALTER TABLE comentarios_solicitud ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comentarios_acceso" ON comentarios_solicitud
    FOR ALL USING (
        -- Solicitantes pueden ver comentarios de sus solicitudes
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc 
            WHERE sc.id = comentarios_solicitud.solicitud_id 
            AND sc.solicitante_id::text = auth.uid()::text
        )
        OR
        -- Operadores pueden ver comentarios de solicitudes asignadas
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc 
            WHERE sc.id = comentarios_solicitud.solicitud_id 
            AND sc.operador_id::text = auth.uid()::text
        )
        OR
        -- Usuarios pueden ver sus propios comentarios
        usuario_id::text = auth.uid()::text
    );
