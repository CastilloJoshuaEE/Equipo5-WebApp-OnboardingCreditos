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
CREATE INDEX IF NOT EXISTS idx_firmas_contrato ON firmas_digitales(contrato_id);
CREATE INDEX IF NOT EXISTS idx_firmas_solicitud ON firmas_digitales(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_firmas_estado ON firmas_digitales(estado);
CREATE INDEX IF NOT EXISTS idx_firmas_signature_request ON firmas_digitales(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_firmas_hash_original ON firmas_digitales(hash_documento_original);
CREATE INDEX IF NOT EXISTS idx_firmas_hash_firmado ON firmas_digitales(hash_documento_firmado);
CREATE INDEX IF NOT EXISTS idx_firmas_fecha_envio ON firmas_digitales(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_firmas_fecha_expiracion ON firmas_digitales(fecha_expiracion);
CREATE OR REPLACE FUNCTION update_firmas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION obtener_firmas_pendientes()
RETURNS TABLE (
    firma_id UUID,
    solicitud_numero VARCHAR(50),
    solicitante_nombre VARCHAR(255),
    solicitante_email VARCHAR(255),
    fecha_envio TIMESTAMPTZ,
    dias_restantes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fd.id,
        sc.numero_solicitud,
        u.nombre_completo,
        u.email,
        fd.fecha_envio,
        EXTRACT(DAYS FROM (fd.fecha_expiracion - NOW()))::INTEGER
    FROM firmas_digitales fd
    JOIN solicitudes_credito sc ON fd.solicitud_id = sc.id
    JOIN solicitantes s ON sc.solicitante_id = s.id
    JOIN usuarios u ON s.id = u.id
    WHERE fd.estado IN ('enviado', 'firmado_solicitante')
    AND fd.fecha_expiracion > NOW()
    ORDER BY fd.fecha_envio ASC;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION verificar_expiracion_firmas()
RETURNS INTEGER AS $$
DECLARE
    firmas_expiradas INTEGER;
BEGIN
    UPDATE firmas_digitales 
    SET estado = 'expirado',
        updated_at = NOW()
    WHERE estado IN ('enviado', 'firmado_solicitante')
    AND fecha_expiracion <= NOW();
    
    GET DIAGNOSTICS firmas_expiradas = ROW_COUNT;
    
    -- Registrar en auditoría
    IF firmas_expiradas > 0 THEN
        INSERT INTO auditoria_firmas (firma_id, accion, descripcion, created_at)
        SELECT 
            id,
            'expiracion_automatica',
            'Firma marcada como expirada automáticamente por el sistema',
            NOW()
        FROM firmas_digitales 
        WHERE estado = 'expirado'
        AND updated_at > (NOW() - INTERVAL '1 minute');
    END IF;
    
    RETURN firmas_expiradas;
END;
$$ LANGUAGE plpgsql;

-- Agregar esta función a la base de datos
CREATE OR REPLACE FUNCTION actualizar_estado_firma_completa()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_firma_solicitante IS NOT NULL AND NEW.fecha_firma_operador IS NOT NULL THEN
        NEW.estado = 'firmado_completo';
        NEW.integridad_valida = true;
        NEW.fecha_firma_completa = NOW();
    ELSIF NEW.fecha_firma_solicitante IS NOT NULL THEN
        NEW.estado = 'firmado_solicitante';
    ELSIF NEW.fecha_firma_operador IS NOT NULL THEN
        NEW.estado = 'firmado_operador';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_firmas_timestamp 
    BEFORE UPDATE ON firmas_digitales 
    FOR EACH ROW EXECUTE FUNCTION update_firmas_timestamp();

CREATE TRIGGER trigger_actualizar_estado_firma
    BEFORE UPDATE ON firmas_digitales
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_firma_completa();
-- Permitir a operadores ver todas las firmas digitales
CREATE POLICY "operadores_ver_firmas" ON firmas_digitales
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND rol = 'operador'
  )
);