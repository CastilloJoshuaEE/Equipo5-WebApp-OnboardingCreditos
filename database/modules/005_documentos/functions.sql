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
