CREATE TRIGGER trigger_solicitudes_timestamp BEFORE UPDATE ON solicitudes_credito
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
