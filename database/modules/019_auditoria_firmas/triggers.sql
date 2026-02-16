CREATE TRIGGER trigger_auditoria_firma 
    AFTER UPDATE ON firmas_digitales 
    FOR EACH ROW EXECUTE FUNCTION log_auditoria_firma();