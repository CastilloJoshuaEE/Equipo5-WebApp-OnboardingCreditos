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
