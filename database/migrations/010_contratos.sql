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

-- Agregar columna tipo a la tabla contratos
ALTER TABLE contratos 
ADD COLUMN tipo VARCHAR(50) DEFAULT 'credito_standard' 
CHECK (tipo IN ('credito_standard', 'credito_empresa', 'credito_pyme'));

-- Actualizar los contratos existentes
UPDATE contratos SET tipo = 'credito_standard' WHERE tipo IS NULL;

ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS hash_contrato VARCHAR(255);


ALTER TABLE contratos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE contratos RENAME COLUMN ruta_pdf TO ruta_documento;


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
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso a documentos de contratos
CREATE POLICY "acceso_documentos_contratos_solicitante" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' 
  AND (
    -- Solicitantes pueden ver sus propios documentos
    (auth.uid()::text IN (
      SELECT sc.solicitante_id::text 
      FROM solicitudes_credito sc
      JOIN contratos c ON c.solicitud_id = sc.id
      WHERE storage.objects.name LIKE '%' || c.id::text || '%'
    ))
    OR
    -- Operadores pueden ver todos los documentos
    auth.uid() IN (SELECT id FROM usuarios WHERE rol = 'operador')
  )
);


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


-- Permitir a operadores ver todos los contratos
CREATE POLICY "operadores_ver_contratos" ON contratos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND rol = 'operador'
  )
);

