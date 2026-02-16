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
