-- Función para limpiar y resetear el proceso
CREATE OR REPLACE FUNCTION resetear_proceso_firma(p_solicitud_id UUID)
RETURNS void AS $$
BEGIN
    -- Eliminar firmas existentes
    DELETE FROM firmas_digitales 
    WHERE solicitud_id = p_solicitud_id;
    
    -- Resetear estado del contrato
    UPDATE contratos 
    SET estado = 'generado',
        firma_digital_id = NULL,
        hash_contrato = NULL
    WHERE solicitud_id = p_solicitud_id;
    
    -- Resetear notificaciones de error
    DELETE FROM notificaciones 
    WHERE solicitud_id = p_solicitud_id 
    AND tipo LIKE '%error_firma_digital%';
END;
$$ LANGUAGE plpgsql;

-- Actualizar contratos cuando se completa la transferencia
CREATE OR REPLACE FUNCTION marcar_solicitud_como_cerrada(p_solicitud_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE solicitudes_credito 
    SET estado = 'cerrada',
        updated_at = NOW()
    WHERE id = p_solicitud_id;
    
    -- También actualizar el contrato
    UPDATE contratos 
    SET estado = 'cerrado',
        updated_at = NOW()
    WHERE solicitud_id = p_solicitud_id;
END;
$$ LANGUAGE plpgsql;
