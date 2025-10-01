-- =========================================
-- ELIMINACIÓN COMPLETA DEL USUARIO 
-- =========================================

-- 1. PRIMERO: Identificar todos los registros del usuario
SELECT '=== IDENTIFICANDO REGISTROS DEL USUARIO ===' as info;

-- Verificar en tabla usuarios
SELECT 'usuarios' as tabla, id, email, nombre_completo, rol 
FROM usuarios 
WHERE email = ''
OR id = 'uuid';

-- Verificar en tabla solicitantes
SELECT 'solicitantes' as tabla, id, nombre_empresa, representante_legal
FROM solicitantes 
WHERE id = 'uuid';

-- Verificar en tabla operadores (por si acaso)
SELECT 'operadores' as tabla, id, nivel
FROM operadores 
WHERE id = 'uuid';

-- 2. SEGUNDO: Eliminar en el orden correcto (primero tablas hijas)
SELECT '=== ELIMINANDO REGISTROS EN ORDEN CORRECTO ===' as info;

-- A. Eliminar de la tabla solicitantes (si existe)
DELETE FROM solicitantes 
WHERE id = 'uuid';

-- Verificar eliminación de solicitantes
SELECT 'solicitantes después de DELETE' as estado, 
       COUNT(*) as registros_restantes
FROM solicitantes 
WHERE id = 'uuid';

-- B. Eliminar de la tabla operadores (si existe)
DELETE FROM operadores 
WHERE id = 'uuid';

-- Verificar eliminación de operadores
SELECT 'operadores después de DELETE' as estado, 
       COUNT(*) as registros_restantes
FROM operadores 
WHERE id = 'uuid';

-- C. Finalmente eliminar de la tabla usuarios
DELETE FROM usuarios 
WHERE email = 'joshuacastillom004@hotmail.com'
OR id = 'uuid';

-- Verificar eliminación de usuarios
SELECT 'usuarios después de DELETE' as estado, 
       COUNT(*) as registros_restantes
FROM usuarios 
WHERE email = 'joshuacastillom004@hotmail.com'
OR id = 'uuid';

-- 3. TERCERO: Eliminar de Auth de Supabase (requiere permisos de Service Role)
SELECT '=== ELIMINACIÓN DE AUTH.SUPABASE ===' as info;

-- NOTA: Para eliminar de auth.users necesitas usar la API de Supabase Admin
-- o ejecutar esto desde el SQL Editor de Supabase con permisos de service_role

-- Opción 1: Usando la función auth.admin.delete_user() (si está disponible)
-- SELECT auth.admin.delete_user('8b573cf7-0411-4a5e-9d6b-6f754e1fea25');

-- Opción 2: Directamente en auth.users (SOLO si tienes acceso)
-- DELETE FROM auth.users WHERE id = '8b573cf7-0411-4a5e-9d6b-6f754e1fea25';

-- 4. CUARTO: Verificación final
SELECT '=== VERIFICACIÓN FINAL ===' as info;

SELECT 
  (SELECT COUNT(*) FROM usuarios WHERE email = 'joshuacastillom004@hotmail.com') as usuarios_restantes,
  (SELECT COUNT(*) FROM solicitantes WHERE id = 'uuid') as solicitantes_restantes,
  (SELECT COUNT(*) FROM operadores WHERE id = 'uuid') as operadores_restantes;

-- Mensaje final
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM usuarios WHERE email = 'joshuacastillom004@hotmail.com') = 0 
    THEN '✅ Usuario eliminado completamente de las tablas personalizadas'
    ELSE '❌ Error: El usuario aún existe en alguna tabla'
  END as resultado;