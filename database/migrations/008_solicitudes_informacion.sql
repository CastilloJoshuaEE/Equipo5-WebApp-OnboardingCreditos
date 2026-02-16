-- Tabla para solicitudes de información adicional
CREATE TABLE solicitudes_informacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    informacion_solicitada TEXT NOT NULL,
    plazo_dias INTEGER NOT NULL DEFAULT 7,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    solicitado_por UUID NOT NULL REFERENCES usuarios(id),
    fecha_limite TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);