COMMENT ON TABLE usuarios IS 'Usuarios del sistema (solicitantes y operadores)';
-- Actualizar la tabla usuarios para incluir las nuevas columnas en comentarios
COMMENT ON COLUMN usuarios.email_recuperacion IS 'Email alternativo para recuperación de cuenta';
COMMENT ON COLUMN usuarios.fecha_desactivacion IS 'Fecha en que el usuario desactivó su cuenta'



