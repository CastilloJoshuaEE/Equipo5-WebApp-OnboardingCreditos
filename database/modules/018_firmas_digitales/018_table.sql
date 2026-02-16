-- TABLA FIRMAS_DIGITALES 
CREATE TABLE firmas_digitales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos(id),
  solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id),
  
  -- Hashes para validación de integridad
  hash_documento_original TEXT NOT NULL,
  hash_documento_firmado TEXT,
  integridad_valida BOOLEAN DEFAULT FALSE,
  
  -- Estados del proceso
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  fecha_envio TIMESTAMP WITH TIME ZONE,
  fecha_firma_solicitante TIMESTAMP WITH TIME ZONE,
  fecha_firma_operador TIMESTAMP WITH TIME ZONE,
  fecha_firma_completa TIMESTAMP WITH TIME ZONE,
  fecha_expiracion TIMESTAMP WITH TIME ZONE,
  
  -- Información del firmante
  ip_firmante INET,
  user_agent_firmante TEXT,
  ubicacion_firmante TEXT,
  
  -- URLs de documentos
  url_documento_firmado TEXT,
  
  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- ACTUALIZAR TABLA CONTRATOS para firma digital

ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS firma_digital_id UUID REFERENCES firmas_digitales(id),
ADD COLUMN IF NOT EXISTS hash_contrato VARCHAR(255);
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'contratos_firma_digital_id_key'
    ) THEN
        ALTER TABLE contratos
        ADD CONSTRAINT contratos_firma_digital_id_key
        UNIQUE (firma_digital_id);
    END IF;
END
$$;

ALTER TABLE firmas_digitales 
DROP COLUMN IF EXISTS document_id;

ALTER TABLE firmas_digitales
ADD COLUMN intentos_envio INTEGER DEFAULT 0;
ALTER TABLE firmas_digitales
ADD COLUMN IF NOT EXISTS signature_request_id UUID;
ALTER TABLE firmas_digitales
ADD COLUMN IF NOT EXISTS url_firma_operador TEXT;
ALTER TABLE firmas_digitales
ADD COLUMN IF NOT EXISTS url_firma_solicitante TEXT;

ALTER TABLE firmas_digitales
ADD COLUMN IF NOT EXISTS ruta_documento TEXT;