CREATE TRIGGER trigger_solicitantes_timestamp BEFORE UPDATE ON solicitantes
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
