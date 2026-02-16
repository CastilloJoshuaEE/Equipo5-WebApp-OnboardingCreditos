
-- Ver sus propias notificaciones
CREATE POLICY "notificaciones_select"
ON notificaciones
FOR SELECT
USING (
    auth.uid()::text = usuario_id::text
    OR auth.role() = 'service_role'
);

-- Actualizar (marcar como leída, etc.)
CREATE POLICY "notificaciones_update"
ON notificaciones
FOR UPDATE
USING (auth.uid()::text = usuario_id::text OR auth.role() = 'service_role');

-- Eliminar (solo administrador o propietario)
CREATE POLICY "notificaciones_delete"
ON notificaciones
FOR DELETE
USING (auth.uid()::text = usuario_id::text OR auth.role() = 'service_role');

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificaciones_insert" ON notificaciones
FOR INSERT 
WITH CHECK (
  auth.uid()::text = usuario_id::text OR
  auth.role() = 'service_role' OR
  EXISTS (
    SELECT 1 FROM solicitudes_credito sc
    WHERE sc.id = solicitud_id
    AND (sc.operador_id::text = auth.uid()::text OR sc.solicitante_id::text = auth.uid()::text)
  ) OR
  -- Permitir que las funciones del sistema inserten notificaciones
  current_user = 'postgres' OR
  current_setting('role') = 'service_role'
);
