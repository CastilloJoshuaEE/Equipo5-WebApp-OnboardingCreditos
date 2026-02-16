-- Tabla para condiciones de aprobación
CREATE TABLE condiciones_aprobacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    condiciones JSONB NOT NULL,
    creado_por UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modificar tabla condiciones_aprobacion para relacionar con documentos
ALTER TABLE condiciones_aprobacion 
ADD COLUMN documento_id UUID REFERENCES documentos(id) ON DELETE CASCADE;
-- Crear índice para búsquedas eficientes
CREATE INDEX idx_condiciones_documento ON condiciones_aprobacion(documento_id);
