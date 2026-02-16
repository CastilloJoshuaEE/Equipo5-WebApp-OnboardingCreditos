-- =========================================
-- TABLA SOLICITANTES (PYMEs)
-- Datos específicos de empresas que solicitan crédito
-- Hereda de usuarios (1:1 relationship)
-- =========================================
CREATE TABLE solicitantes (
    id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'empresa',
    nombre_empresa VARCHAR(255),                     -- Razón social de la empresa
    cuit VARCHAR(20),                                -- CUIT de la empresa (formato: XX-XXXXXXXX-X)
    representante_legal VARCHAR(255),                -- Persona autorizada a firmar
    domicilio TEXT,                                  -- Dirección fiscal de la empresa
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
