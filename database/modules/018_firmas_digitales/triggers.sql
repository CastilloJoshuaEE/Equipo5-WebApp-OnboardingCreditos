CREATE TRIGGER trigger_firmas_timestamp 
    BEFORE UPDATE ON firmas_digitales 
    FOR EACH ROW EXECUTE FUNCTION update_firmas_timestamp();

CREATE TRIGGER trigger_actualizar_estado_firma
    BEFORE UPDATE ON firmas_digitales
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_firma_completa();
