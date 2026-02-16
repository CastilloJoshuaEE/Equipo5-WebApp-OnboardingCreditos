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
CREATE TRIGGER trigger_solicitantes_timestamp BEFORE UPDATE ON solicitantes
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
ALTER TABLE solicitantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solicitantes_propios_datos" ON solicitantes
    FOR ALL USING (auth.uid()::text = id::text);
    COMMENT ON TABLE solicitantes IS 'PYMES que solicitan créditos';
