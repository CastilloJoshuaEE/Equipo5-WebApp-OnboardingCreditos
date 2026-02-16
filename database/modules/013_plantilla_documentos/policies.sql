-- Permitir todo para el service_role key
CREATE POLICY "permitir_admin" 
ON plantilla_documentos
FOR ALL USING (true);
