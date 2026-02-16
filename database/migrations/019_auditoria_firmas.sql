
-- Tabla de auditoría para trazabilidad legal
CREATE TABLE auditoria_firmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id UUID NOT NULL REFERENCES firmas_digitales(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  
  -- Información de la acción
  accion VARCHAR(100) NOT NULL,
  descripcion TEXT,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50),
  
  -- Información técnica
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_firma ON auditoria_firmas(firma_id);
-- Trigger para auditoría automática .
CREATE OR REPLACE FUNCTION log_auditoria_firma()
RETURNS TRIGGER AS $$
DECLARE
    hash_transaccion_val VARCHAR(255);
BEGIN
    -- Generar hash único para la transacción
    hash_transaccion_val := encode(sha256((NEW.id || NOW() || random()::text)::bytea), 'hex');
    
    -- Registrar cambios de estado
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO auditoria_firmas (
            firma_id, usuario_id, accion, descripcion,
            estado_anterior, estado_nuevo, signature_request_id,
            hash_transaccion, created_at
        ) VALUES (
            NEW.id,
            NULL, -- Se puede obtener del contexto si está disponible
            'cambio_estado',
            'Estado de firma cambiado de ' || COALESCE(OLD.estado, 'NULL') || ' a ' || NEW.estado,
            OLD.estado,
            NEW.estado,
            NEW.signature_request_id,
            hash_transaccion_val,
            NOW()
        );
    END IF;
    
    -- Registrar cambios en hash (integridad)
    IF OLD.hash_documento_firmado IS DISTINCT FROM NEW.hash_documento_firmado THEN
        INSERT INTO auditoria_firmas (
            firma_id, accion, descripcion,
            hash_transaccion, created_at
        ) VALUES (
            NEW.id,
            'actualizacion_hash',
            'Hash del documento firmado actualizado. Integridad: ' || COALESCE(NEW.integridad_valida::text, 'NULL'),
            hash_transaccion_val,
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_auditoria_firma 
    AFTER UPDATE ON firmas_digitales 
    FOR EACH ROW EXECUTE FUNCTION log_auditoria_firma();