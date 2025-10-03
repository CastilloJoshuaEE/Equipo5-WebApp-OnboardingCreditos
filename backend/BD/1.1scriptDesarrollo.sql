-- Función para ejecutar SQL dinámico (solo para desarrollo)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Políticas más permisivas para desarrollo
DROP POLICY IF EXISTS "usuarios_propio_perfil" ON usuarios;
CREATE POLICY "allow_all_usuarios" ON usuarios 
FOR ALL USING (true);

DROP POLICY IF EXISTS "solicitantes_propios_datos" ON solicitantes;
CREATE POLICY "allow_all_solicitantes" ON solicitantes 
FOR ALL USING (true);

-- También para operadores
DROP POLICY IF EXISTS "operadores_propios_datos" ON operadores;
CREATE POLICY "allow_all_operadores" ON operadores 
FOR ALL USING (true);