CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_token_confirmacion ON usuarios(token_confirmacion);

-- Crear indice para búsquedas por email de recuperación
CREATE INDEX IF NOT EXISTS idx_usuarios_email_recuperacion ON usuarios(email_recuperacion);
