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


