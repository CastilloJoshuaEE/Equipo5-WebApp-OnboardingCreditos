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