-- =========================================
-- TABLA SOLICITUDES_CREDITO (Core del sistema)
-- Cada registro representa una solicitud de crédito
-- Estados: borrador → enviado → en_revision → aprobado/rechazado
-- =========================================
CREATE TABLE solicitudes_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_solicitud VARCHAR(50) UNIQUE NOT NULL DEFAULT ('SOL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0')),
    
    -- ===== REFERENCIAS =====
    solicitante_id UUID NOT NULL REFERENCES solicitantes(id) ON DELETE CASCADE, -- PYME que solicita
    operador_id UUID REFERENCES operadores(id),                                 -- Analista asignado
    
    -- ===== DATOS DEL CRÉDITO =====
    monto DECIMAL(15,2) NOT NULL CHECK (monto > 0),                            -- Monto solicitado
    moneda VARCHAR(3) DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),          -- Peso argentino o USD
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),                      -- Plazo de pago en meses
    proposito TEXT NOT NULL,                                                   -- Para qué necesita el crédito
    
    -- ===== WORKFLOW Y EVALUACIÓN =====
    estado VARCHAR(50) NOT NULL DEFAULT 'borrador' CHECK (estado IN 
        ('borrador', 'enviado', 'en_revision', 'pendiente_info', 'aprobado', 'rechazado')
    ),
    -- Calculado por algoritmo
     nivel_riesgo VARCHAR(20) CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto')),
    -- ===== DECISIÓN DEL OPERADOR =====
    comentarios TEXT,                                                          -- Observaciones internas
    motivo_rechazo TEXT,                                                       -- Razón si se rechaza
    
    -- Fechas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    fecha_envio TIMESTAMPTZ,
    fecha_decision TIMESTAMPTZ
);
ALTER TABLE solicitudes_credito 
DROP CONSTRAINT IF EXISTS solicitudes_credito_estado_check;
ALTER TABLE solicitudes_credito 
ADD CONSTRAINT solicitudes_credito_estado_check 
CHECK (estado IN (
  'borrador', 'enviado', 'en_revision', 'pendiente_info', 
  'pendiente_firmas', 'aprobado', 'rechazado', 'cerrada'
));

CREATE INDEX idx_solicitudes_solicitante ON solicitudes_credito(solicitante_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_credito(estado);
CREATE INDEX idx_solicitudes_fecha ON solicitudes_credito(created_at DESC);
CREATE TRIGGER trigger_solicitudes_timestamp BEFORE UPDATE ON solicitudes_credito
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();


CREATE POLICY "solicitudes_acceso" ON solicitudes_credito
    FOR ALL USING (
        auth.uid()::text = solicitante_id::text OR
        EXISTS (SELECT 1 FROM operadores WHERE id::text = auth.uid()::text)
    );