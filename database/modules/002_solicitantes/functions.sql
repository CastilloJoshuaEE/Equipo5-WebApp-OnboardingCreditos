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