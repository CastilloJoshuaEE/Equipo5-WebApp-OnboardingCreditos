
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
