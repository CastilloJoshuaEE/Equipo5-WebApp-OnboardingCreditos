CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(leida) WHERE leida = FALSE;
-- Crear índice para búsquedas más eficientes
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leida 
ON notificaciones(usuario_id, leida);

CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at 
ON notificaciones(created_at DESC);
