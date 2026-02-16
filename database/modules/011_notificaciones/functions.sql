-- Auditoría de cambios de estado
CREATE OR REPLACE FUNCTION log_cambio_estado()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado != NEW.estado THEN
        INSERT INTO auditoria (usuario_id, solicitud_id, accion, detalle, estado_anterior, estado_nuevo)
        VALUES (
            NEW.operador_id,
            NEW.id,
            'cambio_estado',
            'Estado cambiado de ' || OLD.estado || ' a ' || NEW.estado,
            OLD.estado,
            NEW.estado
        );
        
        -- Crear notificación para el solicitante
        INSERT INTO notificaciones (usuario_id, solicitud_id, tipo, titulo, mensaje)
        VALUES (
            NEW.solicitante_id,
            NEW.id,
            'cambio_estado',
            CASE NEW.estado
                WHEN 'aprobado' THEN '¡Solicitud aprobada!'
                WHEN 'rechazado' THEN 'Solicitud rechazada'
                WHEN 'en_revision' THEN 'Solicitud en revisión'
                ELSE 'Actualización de solicitud'
            END,
            CASE NEW.estado
                WHEN 'aprobado' THEN 'Tu solicitud ha sido aprobada'
                WHEN 'rechazado' THEN COALESCE('Motivo: ' || NEW.motivo_rechazo, 'Tu solicitud ha sido rechazada')
                WHEN 'en_revision' THEN 'Un analista está revisando tu solicitud'
                ELSE 'El estado de tu solicitud ha cambiado'
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION trigger_iniciar_revision()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se asigna un operador y estaba en estado 'enviado', cambiar a 'en_revision'
    IF NEW.operador_id IS NOT NULL AND OLD.estado='enviado' AND NEW.estado='enviado' THEN
            NEW.estado='en_revision';
            NEW.updated_at= NOW();
        -- Notificar al solicitante
        INSERT INTO notificaciones(usuario_id, solicitud_id, tipo, titulo, mensaje) VALUES(
            NEW.solicitante_id,
            NEW.id,
            'cambio_estado',
            'Solicitud en revisión',
            'Tu solicitud ha sido asignada a un analista y está siendo revisada'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Cambiar estado cuando operador comienza revisión (al abrir acciones)
CREATE OR REPLACE FUNCTION trigger_iniciar_revision_operador()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se asigna un operador y estaba en estado 'enviado', cambiar a 'en_revision'
  IF NEW.operador_id IS NOT NULL AND OLD.estado = 'enviado' AND NEW.estado = 'enviado' THEN
    NEW.estado = 'en_revision';
    NEW.updated_at = NOW();
    
    -- Notificar al solicitante
    INSERT INTO notificaciones(usuario_id, solicitud_id, tipo, titulo, mensaje)
    VALUES(
      NEW.solicitante_id,
      NEW.id,
      'cambio_estado',
      'Solicitud en revisión',
      'Tu solicitud ha sido asignada a un analista y está siendo revisada'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION asignar_operador_automatico(p_solicitud_id UUID)
RETURNS UUID AS $$
DECLARE
    operador_asignado UUID;
    operadores_carga RECORD;
    solicitud_numero TEXT;
    solicitante_nombre TEXT;
    operador_nombre TEXT;
BEGIN
    -- Obtener información de la solicitud
    SELECT numero_solicitud, solicitante_id INTO solicitud_numero, solicitante_nombre
    FROM solicitudes_credito WHERE id = p_solicitud_id;

    -- Buscar operador con menos solicitudes en revisión/pendientes
    SELECT op.id, u.nombre_completo, COUNT(sc.id) as carga
    INTO operador_asignado, operador_nombre
    FROM operadores op
    INNER JOIN usuarios u ON u.id = op.id
    LEFT JOIN solicitudes_credito sc ON sc.operador_id = op.id 
        AND sc.estado IN ('en_revision', 'pendiente_info')
    WHERE op.nivel = 'analista'
        AND u.cuenta_activa = true
    GROUP BY op.id, u.nombre_completo
    ORDER BY COUNT(sc.id) ASC, RANDOM()
    LIMIT 1;

    -- Si no hay operadores disponibles, asignar a cualquier analista activo
    IF operador_asignado IS NULL THEN
        SELECT op.id, u.nombre_completo INTO operador_asignado, operador_nombre
        FROM operadores op
        INNER JOIN usuarios u ON u.id = op.id
        WHERE op.nivel = 'analista'
        AND u.cuenta_activa = true
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;

    -- Actualizar la solicitud
    UPDATE solicitudes_credito
    SET operador_id = operador_asignado,
        estado = 'en_revision',
        updated_at = NOW()
    WHERE id = p_solicitud_id;

    -- Crear notificación para el operador
    INSERT INTO notificaciones(usuario_id, solicitud_id, tipo, titulo, mensaje, leida, created_at)
    VALUES (
        operador_asignado,
        p_solicitud_id,
        'nueva_solicitud',
        'Nueva solicitud asignada',
        'Hola, tienes una nueva solicitud de crédito para revisar. Número: ' || solicitud_numero,
        false,
        NOW()
    );

    -- También notificar al solicitante CON INFORMACIÓN DEL OPERADOR
    INSERT INTO notificaciones(usuario_id, solicitud_id, tipo, titulo, mensaje, leida, created_at, datos_adicionales)
    VALUES (
        (SELECT solicitante_id FROM solicitudes_credito WHERE id = p_solicitud_id),
        p_solicitud_id,
        'operador_asignado',
        'Operador asignado a tu solicitud',
        'Se ha asignado el operador ' || operador_nombre || ' a tu solicitud. Te contactaremos pronto.',
        false,
        NOW(),
        json_build_object(
            'operador_id', operador_asignado,
            'operador_nombre', operador_nombre,
            'tipo_alerta', 'operador_asignado'
        )
    );

    RETURN operador_asignado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

