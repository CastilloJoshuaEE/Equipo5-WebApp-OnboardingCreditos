
-- =========================================
-- TABLA OPERADORES
-- Personal de la entidad financiera que procesa solicitudes
-- Hereda de usuarios (1:1 relationship)
-- =========================================
CREATE TABLE operadores (
    id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nivel VARCHAR(50) NOT NULL CHECK (nivel IN ('analista', 'supervisor')) DEFAULT 'analista',
    permisos TEXT[] DEFAULT ARRAY['revision', 'aprobacion', 'rechazo'], -- Acciones permitidas
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- NOTA: Supervisores pueden aprobar montos mayores que analistas
);

-- Trigger para insertar en tablas hijas según rol
CREATE OR REPLACE FUNCTION insertar_en_tabla_hija()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rol = 'solicitante' THEN
    INSERT INTO solicitantes(id, tipo, nombre_empresa, representante_legal, domicilio)
    VALUES (NEW.id, 'empresa', NULL, NULL, NULL);
  ELSIF NEW.rol = 'operador' THEN
    INSERT INTO operadores(id, nivel, permisos)
    VALUES (NEW.id, 'analista', ARRAY['revision','aprobacion','rechazo']);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_insertar_tabla_hija
AFTER INSERT ON usuarios
FOR EACH ROW EXECUTE FUNCTION insertar_en_tabla_hija();
