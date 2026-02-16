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
CREATE INDEX idx_transferencias_solicitud ON transferencias_bancarias(solicitud_id);
CREATE INDEX idx_transferencias_estado ON transferencias_bancarias(estado);
CREATE INDEX idx_transferencias_comprobante ON transferencias_bancarias(numero_comprobante);
CREATE INDEX idx_transferencias_fecha ON transferencias_bancarias(created_at DESC);
ALTER TABLE transferencias_bancarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transferencias_acceso" ON transferencias_bancarias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc 
            WHERE sc.id = transferencias_bancarias.solicitud_id
            AND (sc.solicitante_id::text = auth.uid()::text OR sc.operador_id::text = auth.uid()::text)
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
