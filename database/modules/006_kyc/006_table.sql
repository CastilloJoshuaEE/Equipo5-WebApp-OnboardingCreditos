-- Tabla para verificaciones KYC
CREATE TABLE verificaciones_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    proveedor VARCHAR(50) NOT NULL DEFAULT 'didit',
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    datos_verificacion JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ
);
