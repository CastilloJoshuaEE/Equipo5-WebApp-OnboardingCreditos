
-- Política para permitir a usuarios autenticados subir archivos
CREATE POLICY "Usuarios autenticados pueden subir documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid() IS NOT NULL
);

-- Política para permitir a usuarios autenticados ver archivos
CREATE POLICY "Cualquiera puede ver documentos kyc"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents');
CREATE POLICY "Usuarios autenticados pueden actualizar documentos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kyc-documents');
CREATE POLICY "Usuarios autenticados pueden eliminar documentos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kyc-documents');

