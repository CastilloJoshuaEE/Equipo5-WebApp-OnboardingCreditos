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