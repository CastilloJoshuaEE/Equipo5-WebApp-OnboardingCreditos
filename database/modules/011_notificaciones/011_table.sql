-- Notificaciones
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    solicitud_id UUID REFERENCES solicitudes_credito(id) ON DELETE SET NULL,
    
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Agregar columna para datos adicionales en notificaciones
ALTER TABLE notificaciones 
ADD COLUMN IF NOT EXISTS datos_adicionales JSONB;
