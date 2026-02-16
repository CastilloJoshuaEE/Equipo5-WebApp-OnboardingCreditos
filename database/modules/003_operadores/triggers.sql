CREATE TRIGGER trigger_insertar_tabla_hija
AFTER INSERT ON usuarios
FOR EACH ROW EXECUTE FUNCTION insertar_en_tabla_hija();
