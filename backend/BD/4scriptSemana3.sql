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

CREATE TABLE historial_contrasenas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_historial_contrasenas_usuario ON historial_contrasenas(usuario_id);

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

-- Modificar tabla condiciones_aprobacion para relacionar con documentos
ALTER TABLE condiciones_aprobacion 
ADD COLUMN documento_id UUID REFERENCES documentos(id) ON DELETE CASCADE;

-- Crear índice para búsquedas eficientes
CREATE INDEX idx_condiciones_documento ON condiciones_aprobacion(documento_id);