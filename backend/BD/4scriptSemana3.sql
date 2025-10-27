CREATE TABLE intentos_login (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    email VARCHAR(255) NOT NULL,
    intento_exitoso BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intentos_login_email ON intentos_login(email);
CREATE INDEX idx_intentos_login_created_at ON intentos_login(created_at);

CREATE TABLE historial_contrasenas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historial_contrasenas_usuario ON historial_contrasenas(usuario_id);

-- Ver sus propias notificaciones
CREATE POLICY "notificaciones_select"
ON notificaciones
FOR SELECT
USING (
    auth.uid()::text = usuario_id::text
    OR auth.role() = 'service_role'
);

-- Actualizar (marcar como leída, etc.)
CREATE POLICY "notificaciones_update"
ON notificaciones
FOR UPDATE
USING (auth.uid()::text = usuario_id::text OR auth.role() = 'service_role');

-- Eliminar (solo administrador o propietario)
CREATE POLICY "notificaciones_delete"
ON notificaciones
FOR DELETE
USING (auth.uid()::text = usuario_id::text OR auth.role() = 'service_role');

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificaciones_insert" ON notificaciones
FOR INSERT 
WITH CHECK (
  auth.uid()::text = usuario_id::text OR
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM solicitudes_credito sc
    WHERE sc.id = solicitud_id
    AND (sc.operador_id::text = auth.uid()::text OR sc.solicitante_id::text = auth.uid()::text)
  ) OR
  -- Permitir que las funciones del sistema inserten notificaciones
  current_user = 'postgres' OR
  current_setting('role') = 'service_role'
);

-- Modificar tabla condiciones_aprobacion para relacionar con documentos
ALTER TABLE condiciones_aprobacion 
ADD COLUMN documento_id UUID REFERENCES documentos(id) ON DELETE CASCADE;

-- Crear índice para búsquedas eficientes
CREATE INDEX idx_condiciones_documento ON condiciones_aprobacion(documento_id);
-- ============================
-- TABLA FIRMAS_DIGITALES (Actualizada)
-- ============================
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


-- ============================
-- ACTUALIZAR TABLA CONTRATOS para firma digital
-- ============================
ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS firma_digital_id UUID REFERENCES firmas_digitales(id),
ADD COLUMN IF NOT EXISTS hash_contrato VARCHAR(255),
ADD COLUMN IF NOT CONSTRAINT contratos_firma_digital_id_key UNIQUE (firma_digital_id);

-- ============================
-- ÍNDICES MEJORADOS
-- ============================
CREATE INDEX IF NOT EXISTS idx_firmas_contrato ON firmas_digitales(contrato_id);
CREATE INDEX IF NOT EXISTS idx_firmas_solicitud ON firmas_digitales(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_firmas_estado ON firmas_digitales(estado);
CREATE INDEX IF NOT EXISTS idx_firmas_signature_request ON firmas_digitales(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_firmas_hash_original ON firmas_digitales(hash_documento_original);
CREATE INDEX IF NOT EXISTS idx_firmas_hash_firmado ON firmas_digitales(hash_documento_firmado);
CREATE INDEX IF NOT EXISTS idx_firmas_fecha_envio ON firmas_digitales(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_firmas_fecha_expiracion ON firmas_digitales(fecha_expiracion);

CREATE INDEX IF NOT EXISTS idx_auditoria_firma ON auditoria_firmas(firma_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_event ON auditoria_firmas(event_type);
CREATE INDEX IF NOT EXISTS idx_auditoria_hash ON auditoria_firmas(hash_transaccion);

-- ============================
-- TRIGGERS MEJORADOS
-- ============================
CREATE OR REPLACE FUNCTION update_firmas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_firmas_timestamp 
    BEFORE UPDATE ON firmas_digitales 
    FOR EACH ROW EXECUTE FUNCTION update_firmas_timestamp();

-- Trigger para auditoría automática mejorado
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

-- ============================
-- FUNCIONES UTILES
-- ============================
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


CREATE TABLE IF NOT EXISTS configuraciones (
    clave VARCHAR(100) PRIMARY KEY,
    valor VARCHAR(255) NOT NULL,
    descripcion TEXT
);

INSERT INTO configuraciones (clave, valor, descripcion) VALUES
('firma_digital_habilitada', 'true', 'Habilita el módulo de firma digital'),
('firma_digital_expiracion_dias', '7', 'Días para expirar una solicitud de firma'),
('firma_digital_max_reintentos', '3', 'Máximo número de reintentos de envío'),
('firma_digital_timezone', 'America/Mexico_City', 'Zona horaria para fechas de firma')
ON CONFLICT (clave) DO UPDATE SET 
valor = EXCLUDED.valor,
descripcion = EXCLUDED.descripcion;


-- Agregar columna tipo a la tabla contratos
ALTER TABLE contratos 
ADD COLUMN tipo VARCHAR(50) DEFAULT 'credito_standard' 
CHECK (tipo IN ('credito_standard', 'credito_empresa', 'credito_pyme'));

-- Actualizar los contratos existentes
UPDATE contratos SET tipo = 'credito_standard' WHERE tipo IS NULL;

ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS firma_digital_id UUID REFERENCES firmas_digitales(id),
ADD COLUMN IF NOT EXISTS hash_contrato VARCHAR(255);


ALTER TABLE contratos 
ADD CONSTRAINT contratos_firma_digital_id_key UNIQUE (firma_digital_id);


CREATE POLICY "contratos_acceso_solicitante" ON contratos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc
            WHERE sc.id = contratos.solicitud_id
            AND sc.solicitante_id::text = auth.uid()::text
        )
    );

CREATE POLICY "contratos_acceso_operador" ON contratos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc
            WHERE sc.id = contratos.solicitud_id
            AND sc.operador_id::text = auth.uid()::text
        )
    );

CREATE POLICY "contratos_acceso_admin" ON contratos
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "contratos_insert"
ON contratos
FOR INSERT
WITH CHECK (
  -- Permitir si el usuario es el operador o solicitante de la solicitud
  EXISTS (
    SELECT 1 FROM solicitudes_credito sc
    WHERE sc.id = contratos.solicitud_id
    AND (
      sc.operador_id::text = auth.uid()::text
      OR sc.solicitante_id::text = auth.uid()::text
    )
  )
  OR
  -- Permitir al rol de servicio
  auth.role() = 'service_role'
  OR
  -- Permitir al usuario postgres interno (funciones del backend)
  current_user = 'postgres'
);

CREATE POLICY "contratos_select"
ON contratos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM solicitudes_credito sc
    WHERE sc.id = contratos.solicitud_id
    AND (
      sc.operador_id::text = auth.uid()::text
      OR sc.solicitante_id::text = auth.uid()::text
    )
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "contratos_update"
ON contratos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM solicitudes_credito sc
    WHERE sc.id = contratos.solicitud_id
    AND (
      sc.operador_id::text = auth.uid()::text
      OR sc.solicitante_id::text = auth.uid()::text
    )
  )
  OR auth.role() = 'service_role'
);




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


ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE contratos RENAME COLUMN ruta_pdf TO ruta_documento;


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
