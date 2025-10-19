-- =========================================
-- TABLA CONTRATOS
-- Solo se crea cuando una solicitud es APROBADA
-- Relación 1:1 con solicitudes_credito
-- =========================================
CREATE TABLE contratos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID UNIQUE NOT NULL REFERENCES solicitudes_credito(id),     -- 1:1 con solicitud
    numero_contrato VARCHAR(100) UNIQUE NOT NULL,                             -- Número único del contrato
    
    -- ===== TÉRMINOS FINANCIEROS =====
    monto_aprobado DECIMAL(15,2) NOT NULL,                                    -- Puede ser menor al solicitado
    tasa_interes DECIMAL(5,2) NOT NULL,                                       -- Tasa anual (ej: 24.50)
    plazo_meses INTEGER NOT NULL,                                             -- Plazo de pago
    
    -- ===== WORKFLOW DE FIRMA =====
    estado VARCHAR(50) DEFAULT 'generado' CHECK (estado IN 
        ('generado', 'firmado_solicitante', 'firmado_completo', 'vigente')
    ),
    
    -- ===== ARCHIVO PDF =====
    ruta_pdf TEXT,                                                            -- PDF generado en Supabase Storage
    
    -- ===== FECHAS =====
    created_at TIMESTAMPTZ DEFAULT NOW(),                                     -- Fecha de generación
    fecha_firma_solicitante TIMESTAMPTZ,                                      -- Cuándo firmó la PYME
    fecha_firma_entidad TIMESTAMPTZ                                           -- Cuándo firmó la entidad
);

-- Notificaciones
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    solicitud_id UUID REFERENCES solicitudes_credito(id) ON DELETE SET NULL,
    
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auditoría simple
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    solicitud_id UUID REFERENCES solicitudes_credito(id),
    
    accion VARCHAR(100) NOT NULL,
    detalle TEXT,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- ÍNDICES ESENCIALES
-- =========================================


CREATE INDEX idx_solicitudes_solicitante ON solicitudes_credito(solicitante_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_credito(estado);
CREATE INDEX idx_solicitudes_fecha ON solicitudes_credito(created_at DESC);

CREATE INDEX idx_documentos_solicitud ON documentos(solicitud_id);
CREATE INDEX idx_documentos_tipo ON documentos(tipo);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida) WHERE leida = FALSE;

CREATE INDEX idx_auditoria_solicitud ON auditoria(solicitud_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at DESC);

-- =========================================
-- TRIGGERS AUTOMÁTICOS
-- =========================================

-- Actualizar updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_solicitantes_timestamp BEFORE UPDATE ON solicitantes
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_solicitudes_timestamp BEFORE UPDATE ON solicitudes_credito
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

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

CREATE TRIGGER trigger_auditoria_solicitud AFTER UPDATE ON solicitudes_credito
    FOR EACH ROW EXECUTE FUNCTION log_cambio_estado();

-- =========================================
-- FUNCIONES ÚTILES PARA EL NEGOCIO
-- Lógica reutilizable que simplifica las consultas del frontend
-- =========================================

-- =========================================
-- FUNCIÓN: Validar solicitud completa
-- Verifica si una solicitud tiene los documentos KYC mínimos
-- USAR EN: Frontend antes de permitir envío de solicitud
-- =========================================
CREATE OR REPLACE FUNCTION validar_solicitud_completa(p_solicitud_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    docs_minimos INTEGER;
BEGIN
    -- Cuenta documentos obligatorios validados
    SELECT COUNT(*) INTO docs_minimos
    FROM documentos
    WHERE solicitud_id = p_solicitud_id
        AND tipo IN ('dni', 'cuit', 'comprobante_domicilio')  -- Documentos mínimos KYC
        AND estado = 'validado';
    
    RETURN docs_minimos >= 3;  -- Debe tener los 3 documentos básicos
END;
$$ LANGUAGE plpgsql;

-- Estadísticas de solicitante
CREATE OR REPLACE FUNCTION stats_solicitante(p_solicitante_id UUID)
RETURNS TABLE (
    total_solicitudes BIGINT,
    aprobadas BIGINT,
    rechazadas BIGINT,
    pendientes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(CASE WHEN estado = 'aprobado' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN estado = 'rechazado' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN estado NOT IN ('aprobado', 'rechazado') THEN 1 END)::BIGINT
    FROM solicitudes_credito
    WHERE solicitante_id = p_solicitante_id;
END;
$$ LANGUAGE plpgsql;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solicitudes_acceso" ON solicitudes_credito
    FOR ALL USING (
        auth.uid()::text = solicitante_id::text OR
        EXISTS (SELECT 1 FROM operadores WHERE id::text = auth.uid()::text)
    );

CREATE POLICY "contratos_acceso" ON contratos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc
            WHERE sc.id = contratos.solicitud_id
            AND (sc.solicitante_id::text = auth.uid()::text OR
                 EXISTS (SELECT 1 FROM operadores WHERE id::text = auth.uid()::text))
        )
    );

CREATE POLICY "notificaciones_propias" ON notificaciones
    FOR ALL USING (auth.uid()::text = usuario_id::text);

-- TRIGGER: Cambiar estado cuando operador comienza revisión
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
CREATE TRIGGER trigger_iniciar_revision_solicitud
    BEFORE UPDATE ON solicitudes_credito
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_iniciar_revision();

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

CREATE TRIGGER trigger_iniciar_revision_operador
BEFORE UPDATE ON solicitudes_credito
FOR EACH ROW
EXECUTE FUNCTION trigger_iniciar_revision_operador();
-- Actualizar la función para asegurar que las notificaciones se creen correctamente
CREATE OR REPLACE FUNCTION asignar_operador_automatico(p_solicitud_id UUID)
RETURNS UUID AS $$
DECLARE
    operador_asignado UUID;
    operadores_carga RECORD;
    solicitud_numero TEXT;
    solicitante_nombre TEXT;
BEGIN
    -- Obtener información de la solicitud
    SELECT numero_solicitud, solicitante_id INTO solicitud_numero, solicitante_nombre
    FROM solicitudes_credito WHERE id = p_solicitud_id;

    -- Buscar operador con menos solicitudes en revisión/pendientes
    SELECT op.id, COUNT(sc.id) as carga
    INTO operador_asignado
    FROM operadores op
    LEFT JOIN solicitudes_credito sc ON sc.operador_id = op.id 
        AND sc.estado IN ('en_revision', 'pendiente_info')
    WHERE op.nivel = 'analista'
        AND op.id IN (SELECT id FROM usuarios WHERE cuenta_activa = true)
    GROUP BY op.id
    ORDER BY COUNT(sc.id) ASC, RANDOM()
    LIMIT 1;

    -- Si no hay operadores disponibles, asignar a cualquier analista activo
    IF operador_asignado IS NULL THEN
        SELECT id INTO operador_asignado
        FROM operadores
        WHERE nivel = 'analista'
        AND id IN (SELECT id FROM usuarios WHERE cuenta_activa = true)
        ORDER BY RANDOM()
        LIMIT 1;
    END IF;

    -- Actualizar la solicitud
    UPDATE solicitudes_credito
    SET operador_id = operador_asignado,
        estado = 'en_revision',
        updated_at = NOW()
    WHERE id = p_solicitud_id;

    -- Crear notificación para el operador con mensaje específico
    INSERT INTO notificaciones(usuario_id, solicitud_id, tipo, titulo, mensaje, leida, created_at)
    VALUES (
        operador_asignado,
        p_solicitud_id,
        'nueva_solicitud',
        'Nueva solicitud asignada',
        'Buenas tardes, tienes una nueva solicitud de crédito para revisar. Número: ' || solicitud_numero,
        false,
        NOW()
    );

    -- También notificar al solicitante
    INSERT INTO notificaciones(usuario_id, solicitud_id, tipo, titulo, mensaje, leida, created_at)
    VALUES (
        (SELECT solicitante_id FROM solicitudes_credito WHERE id = p_solicitud_id),
        p_solicitud_id,
        'cambio_estado',
        'Solicitud en revisión',
        'Tu solicitud ha sido enviada y está siendo revisada por nuestro equipo.',
        false,
        NOW()
    );

    RETURN operador_asignado;
END;
$$ LANGUAGE plpgsql;

-- Agregar columna para datos adicionales en notificaciones
ALTER TABLE notificaciones 
ADD COLUMN IF NOT EXISTS datos_adicionales JSONB;

-- Crear índice para búsquedas más eficientes
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leida 
ON notificaciones(usuario_id, leida);

CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at 
ON notificaciones(created_at DESC);

ALTER TABLE documentos
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
