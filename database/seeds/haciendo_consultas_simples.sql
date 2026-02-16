-- Listar todos los buckets existentes
SELECT *
FROM storage.buckets;

-- Obtener detalles de un bucket específico por su nombre
SELECT *
FROM storage.buckets
WHERE name = 'kyc-documents';

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND (qual ILIKE '%kyc-documents%' OR with_check ILIKE '%kyc-documents%');
  
SELECT id, bucket_id, owner, name
FROM storage.objects
WHERE bucket_id = 'kyc-documents'
LIMIT 10;