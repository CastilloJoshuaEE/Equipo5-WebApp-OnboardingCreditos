CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE intentos_login (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    email VARCHAR(255) NOT NULL,
    intento_exitoso BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_intentos_login_email ON intentos_login(email);
CREATE INDEX idx_intentos_login_created_at ON intentos_login(created_at);
 CREATE OR REPLACE FUNCTION limpiar_intentos_login_antiguos()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM intentos_login
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;
SELECT cron.schedule(
  'limpiar_intentos_login_diario',
  '0 0 * * *',  -- todos los días a las 00:00
  $$DELETE FROM intentos_login 
    WHERE created_at < NOW() - INTERVAL '24 hours';$$
);