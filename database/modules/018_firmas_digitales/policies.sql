-- Permitir a operadores ver todas las firmas digitales
CREATE POLICY "operadores_ver_firmas" ON firmas_digitales
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND rol = 'operador'
  )
);