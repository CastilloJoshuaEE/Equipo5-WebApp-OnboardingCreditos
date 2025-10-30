-- TABLA PARA CONTACTOS BANCARIOS
CREATE TABLE contactos_bancarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_banco VARCHAR(100) NOT NULL DEFAULT 'Pichincha',
    numero_cuenta VARCHAR(50) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL DEFAULT 'ahorros' CHECK (tipo_cuenta IN ('ahorros', 'corriente')),
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'ARS')),
    email_contacto VARCHAR(255),
    telefono_contacto VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Restricción única para evitar cuentas duplicadas
    UNIQUE( numero_cuenta)
);

-- TABLA PARA TRANSFERENCIAS BANCARIAS
CREATE TABLE transferencias_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    contrato_id UUID NOT NULL REFERENCES contratos(id),
    contacto_bancario_id UUID NOT NULL REFERENCES contactos_bancarios(id),
    
    -- Información de la transferencia
    monto DECIMAL(15,2) NOT NULL CHECK (monto > 0),
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'ARS')),
    numero_comprobante VARCHAR(100) UNIQUE,
    
    -- Cuentas involucradas
    cuenta_origen VARCHAR(50) NOT NULL DEFAULT 'NEXIA-001-USD',
    banco_origen VARCHAR(100) NOT NULL DEFAULT 'Nexia Bank',
    cuenta_destino VARCHAR(50) NOT NULL,
    banco_destino VARCHAR(100) NOT NULL DEFAULT 'Banco Pichincha',
    
    -- Información adicional
    motivo TEXT,
    costo_transferencia DECIMAL(10,2) DEFAULT 0,
    
    -- Estados del proceso
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'completada', 'fallida', 'reversada')),
    
    -- Auditoría
    procesado_por UUID REFERENCES operadores(id),
    fecha_procesamiento TIMESTAMPTZ,
    fecha_completada TIMESTAMPTZ,
    
    -- Comprobante
    ruta_comprobante TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_contactos_bancarios_estado ON contactos_bancarios(estado);
CREATE INDEX idx_transferencias_solicitud ON transferencias_bancarias(solicitud_id);
CREATE INDEX idx_transferencias_estado ON transferencias_bancarias(estado);
CREATE INDEX idx_transferencias_comprobante ON transferencias_bancarias(numero_comprobante);
CREATE INDEX idx_transferencias_fecha ON transferencias_bancarias(created_at DESC);

-- POLÍTICAS RLS
ALTER TABLE contactos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transferencias_acceso" ON transferencias_bancarias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc 
            WHERE sc.id = transferencias_bancarias.solicitud_id
            AND (sc.solicitante_id::text = auth.uid()::text OR sc.operador_id::text = auth.uid()::text)
        )
    );

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

-- Crear el trigger
CREATE TRIGGER trigger_actualizar_estado_firma
    BEFORE UPDATE ON firmas_digitales
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_firma_completa();



-- Política para permitir a operadores ver todos los contactos
CREATE POLICY "Operadores pueden ver contactos" ON contactos_bancarios
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'operador' AND cuenta_activa = true
        )
    );

-- Política para permitir a operadores insertar contactos
CREATE POLICY "Operadores pueden insertar contactos" ON contactos_bancarios
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'operador' AND cuenta_activa = true
        )
    );

-- Política para permitir a operadores actualizar contactos
CREATE POLICY "Operadores pueden actualizar contactos" ON contactos_bancarios
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'operador' AND cuenta_activa = true
        )
    );

-- Política para permitir a operadores eliminar contactos
CREATE POLICY "Operadores pueden eliminar contactos" ON contactos_bancarios
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'operador' AND cuenta_activa = true
        )
    );


ALTER TABLE contactos_bancarios 
ADD COLUMN IF NOT EXISTS solicitante_id UUID REFERENCES solicitantes(id);

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_contactos_solicitante ON contactos_bancarios(solicitante_id);


ALTER TABLE solicitudes_credito 
DROP CONSTRAINT IF EXISTS solicitudes_credito_estado_check;

ALTER TABLE solicitudes_credito 
ADD CONSTRAINT solicitudes_credito_estado_check 
CHECK (estado IN (
  'borrador', 'enviado', 'en_revision', 'pendiente_info', 
  'pendiente_firmas', 'aprobado', 'rechazado', 'cerrada'
));



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


-- Permitir a operadores ver todos los contratos
CREATE POLICY "operadores_ver_contratos" ON contratos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND rol = 'operador'
  )
);

-- Permitir a operadores ver todas las firmas digitales
CREATE POLICY "operadores_ver_firmas" ON firmas_digitales
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND rol = 'operador'
  )
);

-- Permitir a operadores ver todas las transferencias
CREATE POLICY "operadores_ver_transferencias" ON transferencias_bancarias
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND rol = 'operador'
  )
);


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
