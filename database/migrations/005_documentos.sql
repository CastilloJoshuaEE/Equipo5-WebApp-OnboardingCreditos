-- TABLA DOCUMENTOS (KYC/AML)
-- Archivos que debe subir cada solicitante
-- Mínimo requerido: DNI + CUIT + Comprobante domicilio
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    
    -- ===== TIPO DE DOCUMENTO =====
    tipo VARCHAR(100) NOT NULL CHECK (tipo IN (
        'dni',                    -- Documento Nacional de Identidad (OBLIGATORIO)
        'cuit',                   -- Constancia de CUIT (OBLIGATORIO)
        'comprobante_domicilio',  -- Factura luz/gas/agua (OBLIGATORIO)
        'balance_contable',       -- Balance empresa
        'estado_financiero',      -- Estado de resultados
        'declaracion_impuestos'  -- DDJJ de impuestos
    )),
    
    -- ===== ARCHIVO =====
    nombre_archivo VARCHAR(255) NOT NULL,                                     -- Nombre del archivo
    ruta_storage TEXT NOT NULL,                                               -- URL/path en Supabase Storage
    tamanio_bytes BIGINT,                                                     -- Tamaño del archivo
    
    -- ===== VALIDACIÓN =====
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'validado', 'rechazado')),
    comentarios TEXT,  
    informacion_extraida JSONB,                                                       -- Feedback del operador
    
    created_at TIMESTAMPTZ DEFAULT NOW(),                                    -- Fecha de subida
    validado_en TIMESTAMPTZ                                                   -- Fecha de validación
);

ALTER TABLE documentos
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_documentos_informacion_extraida 
ON documentos USING gin (informacion_extraida);
CREATE INDEX idx_documentos_solicitud ON documentos(solicitud_id);
CREATE INDEX idx_documentos_tipo ON documentos(tipo);
-- FUNCIÓN: Validar solicitud completa
-- Verifica si una solicitud tiene los documentos KYC mínimos
-- USAR EN: Frontend antes de permitir envío de solicitud
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
