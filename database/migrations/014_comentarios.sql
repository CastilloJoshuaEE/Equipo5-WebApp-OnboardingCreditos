-- TABLA COMENTARIOS
-- Para comentarios adicionales del operador al solicitante
CREATE TABLE comentarios_solicitud (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, -- Quién hace el comentario
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('operador_a_solicitante', 'solicitante_a_operador', 'interno')),
    comentario TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comentarios_solicitud ON comentarios_solicitud(solicitud_id);
CREATE INDEX idx_comentarios_usuario ON comentarios_solicitud(usuario_id);
CREATE INDEX idx_comentarios_tipo ON comentarios_solicitud(tipo);
CREATE INDEX idx_comentarios_leido ON comentarios_solicitud(leido) WHERE leido = FALSE;
CREATE INDEX idx_comentarios_created_at ON comentarios_solicitud(created_at DESC);
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
