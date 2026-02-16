-- FUNCIONES UTILES DE SIMULACION DE SUPABASE SOLO PARA DESARROLLO LOCAL:
-- CREATE SCHEMA IF NOT EXISTS auth;

-- CREATE OR REPLACE FUNCTION auth.uid()
-- RETURNS uuid
-- LANGUAGE sql
-- AS $$
--    SELECT NULL::uuid;
-- $$;

DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_roles WHERE rolname = 'authenticated'
   ) THEN
      CREATE ROLE authenticated;
   END IF;
END
$$;

--Simular auth.role()
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN current_setting('app.current_user_role', true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;



CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now()
);
