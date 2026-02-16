-- Auditoría simple
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    solicitud_id UUID REFERENCES solicitudes_credito(id),
    
    accion VARCHAR(100) NOT NULL,
    detalle TEXT,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_auditoria_solicitud ON auditoria(solicitud_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at DESC);
