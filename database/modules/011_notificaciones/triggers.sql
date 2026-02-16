-- TRIGGER: Cambiar estado cuando operador comienza revisión
CREATE TRIGGER trigger_auditoria_solicitud AFTER UPDATE ON solicitudes_credito
    FOR EACH ROW EXECUTE FUNCTION log_cambio_estado();

CREATE TRIGGER trigger_iniciar_revision_solicitud
    BEFORE UPDATE ON solicitudes_credito
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_iniciar_revision();

CREATE TRIGGER trigger_iniciar_revision_operador
BEFORE UPDATE ON solicitudes_credito
FOR EACH ROW
EXECUTE FUNCTION trigger_iniciar_revision_operador();
