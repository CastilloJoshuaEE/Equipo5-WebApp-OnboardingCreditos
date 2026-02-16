
-- Tabla de auditoría para trazabilidad legal
CREATE TABLE auditoria_firmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firma_id UUID NOT NULL REFERENCES firmas_digitales(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  
  -- Información de la acción
  accion VARCHAR(100) NOT NULL,
  descripcion TEXT,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50),
  
  -- Información técnica
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
