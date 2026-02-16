
-- =========================================
-- TABLA OPERADORES
-- Personal de la entidad financiera que procesa solicitudes
-- Hereda de usuarios (1:1 relationship)
-- =========================================
CREATE TABLE operadores (
    id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    nivel VARCHAR(50) NOT NULL CHECK (nivel IN ('analista', 'supervisor')) DEFAULT 'analista',
    permisos TEXT[] DEFAULT ARRAY['revision', 'aprobacion', 'rechazo'], -- Acciones permitidas
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- NOTA: Supervisores pueden aprobar montos mayores que analistas
);
