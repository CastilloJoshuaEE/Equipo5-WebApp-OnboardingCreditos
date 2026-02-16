
-- Crear índice para búsquedas por token
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION eliminar_usuario_completamente(p_usuario_id UUID)
RETURNS void AS $$
BEGIN

-- 1. ELIMINAR REGISTROS DE AUDITORÍA RELACIONADOS
DELETE FROM auditoria 
WHERE usuario_id = p_usuario_id
   OR solicitud_id IN (
       SELECT id FROM solicitudes_credito 
       WHERE solicitante_id = p_usuario_id
          OR operador_id = p_usuario_id
   );
-- 2. ELIMINAR AUDITORÍA DE FIRMAS RELACIONADAS
DELETE FROM auditoria_firmas 
WHERE firma_id IN (
    SELECT id FROM firmas_digitales 
    WHERE solicitud_id IN (
        SELECT id FROM solicitudes_credito 
        WHERE solicitante_id = p_usuario_id
           OR operador_id = p_usuario_id
    )
)
OR usuario_id = p_usuario_id;

-- 3. ELIMINAR INTERACCIONES DEL CHATBOT
DELETE FROM chatbot_interacciones 
WHERE usuario_id = p_usuario_id;

-- 4. ELIMINAR INTENTOS DE LOGIN
DELETE FROM intentos_login 
WHERE usuario_id = p_usuario_id;

-- 5. ELIMINAR HISTORIAL DE CONTRASEÑAS
DELETE FROM historial_contrasenas 
WHERE usuario_id = p_usuario_id;

-- 6. ELIMINAR NOTIFICACIONES
DELETE FROM notificaciones 
WHERE usuario_id = p_usuario_id
   OR solicitud_id IN (
       SELECT id FROM solicitudes_credito 
       WHERE solicitante_id = p_usuario_id
          OR operador_id = p_usuario_id
   );

-- 7. ELIMINAR COMENTARIOS DE SOLICITUDES
DELETE FROM comentarios_solicitud 
WHERE usuario_id = p_usuario_id
   OR solicitud_id IN (
       SELECT id FROM solicitudes_credito 
       WHERE solicitante_id = p_usuario_id
          OR operador_id = p_usuario_id
   );

-- 8. ELIMINAR CONDICIONES DE APROBACIÓN CREADAS POR EL USUARIO
DELETE FROM condiciones_aprobacion 
WHERE creado_por = p_usuario_id;

-- 9. ELIMINAR SOLICITUDES DE INFORMACIÓN CREADAS POR EL USUARIO
DELETE FROM solicitudes_informacion 
WHERE solicitado_por = p_usuario_id;

-- 10. ELIMINAR VERIFICACIONES KYC RELACIONADAS
DELETE FROM verificaciones_kyc 
WHERE solicitud_id IN (
    SELECT id FROM solicitudes_credito 
    WHERE solicitante_id = p_usuario_id
);

-- 11. OBTENER SOLICITUDES RELACIONADAS CON EL USUARIO PARA ELIMINAR DOCUMENTOS
WITH solicitudes_relacionadas AS (
    SELECT id FROM solicitudes_credito 
    WHERE solicitante_id = p_usuario_id
       OR operador_id = p_usuario_id
)
-- Eliminar documentos de las solicitudes
DELETE FROM documentos 
WHERE solicitud_id IN (SELECT id FROM solicitudes_relacionadas);

-- 12. ELIMINAR FIRMAS DIGITALES RELACIONADAS
DELETE FROM firmas_digitales 
WHERE solicitud_id IN (
    SELECT id FROM solicitudes_credito 
    WHERE solicitante_id = p_usuario_id
       OR operador_id = p_usuario_id
);
-- 12b. ELIMINAR TRANSFERENCIAS RELACIONADAS A CONTRATOS DE LAS SOLICITUDES
DELETE FROM transferencias_bancarias
WHERE contrato_id IN (
    SELECT id FROM contratos
    WHERE solicitud_id IN (
        SELECT id FROM solicitudes_credito
        WHERE solicitante_id = p_usuario_id
           OR operador_id = p_usuario_id
    )
);

-- 13. ELIMINAR CONTRATOS RELACIONADOS
DELETE FROM contratos 
WHERE solicitud_id IN (
    SELECT id FROM solicitudes_credito 
    WHERE solicitante_id = p_usuario_id
       OR operador_id = p_usuario_id
);

-- 14. ELIMINAR SOLICITUDES DE CRÉDITO
DELETE FROM solicitudes_credito 
WHERE solicitante_id = p_usuario_id
   OR operador_id = p_usuario_id;
-- 14.5 ELIMINAR CONTACTOS BANCARIOS ASOCIADOS AL SOLICITANTE
DELETE FROM contactos_bancarios
WHERE solicitante_id = p_usuario_id;
-- 15. ELIMINAR REGISTROS EN TABLAS ESPECÍFICAS DEL ROL
DELETE FROM operadores 
WHERE id = p_usuario_id;

DELETE FROM solicitantes 
WHERE id = p_usuario_id;

-- 16. FINALMENTE ELIMINAR EL USUARIO PRINCIPAL
DELETE FROM usuarios 
WHERE id = p_usuario_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error eliminando usuario: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
