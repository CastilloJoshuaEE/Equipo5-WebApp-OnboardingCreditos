-- =========================================
-- TABLA USUARIOS (Base para herencia)
-- Almacena datos comunes de solicitantes y operadores
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(255) NOT NULL,           -- Nombre legal completo
    email VARCHAR(255) UNIQUE NOT NULL,              -- Email único para login
    telefono VARCHAR(20),                            -- Número de contacto
    dni VARCHAR(50) UNIQUE NOT NULL,    -- DNI/CI para identificación
    password_hash VARCHAR(255) NOT NULL,             -- Contraseña hasheada (usar bcrypt)
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('solicitante', 'operador')), -- Tipo de usuario
    cuenta_activa BOOLEAN DEFAULT TRUE,              -- Para soft delete
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Timestamp de registro
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    token_confirmacion TEXT DEFAULT NULL,            -- Token de confirmación
    token_expiracion TIMESTAMPTZ DEFAULT NULL                -- Última modificación
);
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS email_recuperacion VARCHAR(255),
ADD COLUMN IF NOT EXISTS fecha_desactivacion TIMESTAMPTZ;
