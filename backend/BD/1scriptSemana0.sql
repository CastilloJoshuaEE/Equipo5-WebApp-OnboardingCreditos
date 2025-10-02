
-- =========================================
-- EXTENSIONES REQUERIDAS
-- =========================================
-- uuid-ossp: Para generar IDs únicos UUID
-- pgcrypto: Para hash de contraseñas y funciones crypto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- TABLAS PRINCIPALES
-- =========================================

-- =========================================
-- TABLA USUARIOS (Base para herencia)
-- Almacena datos comunes de solicitantes y operadores
-- Agregar columnas para tokens de confirmación (opcional)
-- ALTER TABLE usuarios 
-- ADD COLUMN IF NOT EXISTS token_confirmacion TEXT,
-- ADD COLUMN IF NOT EXISTS token_expiracion TIMESTAMPTZ;

-- Crear índice para búsquedas por token
-- CREATE INDEX IF NOT EXISTS idx_usuarios_token_confirmacion ON usuarios(token_confirmacion);
-- =========================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(255) NOT NULL,           -- Nombre legal completo
    email VARCHAR(255) UNIQUE NOT NULL,              -- Email único para login
    telefono VARCHAR(20),                            -- Número de contacto
    cedula_identidad VARCHAR(50) UNIQUE NOT NULL,    -- DNI/CI para identificación
    password_hash VARCHAR(255) NOT NULL,             -- Contraseña hasheada (usar bcrypt)
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('solicitante', 'operador')), -- Tipo de usuario
    cuenta_activa BOOLEAN DEFAULT TRUE,              -- Para soft delete
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Timestamp de registro
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    token_confirmacion TEXT DEFAULT NULL,            -- Token de confirmación
    token_expiracion TIMESTAMPTZ DEFAULT NULL,                -- Última modificación
);

-- =========================================
-- TABLA SOLICITANTES (PYMEs)
-- Datos específicos de empresas que solicitan crédito
-- Hereda de usuarios (1:1 relationship)
-- =========================================
CREATE TABLE solicitantes (
    id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'empresa',
    nombre_empresa VARCHAR(255),                     -- Razón social de la empresa
    cuit VARCHAR(20),                                -- CUIT de la empresa (formato: XX-XXXXXXXX-X)
    representante_legal VARCHAR(255),                -- Persona autorizada a firmar
    domicilio TEXT,                                  -- Dirección fiscal de la empresa
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- Crear índice para búsquedas por token
CREATE INDEX IF NOT EXISTS idx_usuarios_token_confirmacion ON usuarios(token_confirmacion);
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_usuarios_timestamp BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitantes ENABLE ROW LEVEL SECURITY;
-- Políticas simples
CREATE POLICY "usuarios_propio_perfil" ON usuarios
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "solicitantes_propios_datos" ON solicitantes
    FOR ALL USING (auth.uid()::text = id::text);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema (solicitantes y operadores)';
COMMENT ON TABLE solicitantes IS 'PYMES que solicitan créditos';
-- Trigger para insertar en tablas hijas según rol
CREATE OR REPLACE FUNCTION insertar_en_tabla_hija()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rol = 'solicitante' THEN
    INSERT INTO solicitantes(id, tipo, nombre_empresa, representante_legal, domicilio)
    VALUES (NEW.id, 'empresa', 'Empresa de ' || split_part(NEW.nombre_completo, ' ', 1),
            NEW.nombre_completo, 'Dirección de ' || split_part(NEW.nombre_completo, ' ', 1));
  ELSIF NEW.rol = 'operador' THEN
    INSERT INTO operadores(id, nivel, permisos)
    VALUES (NEW.id, 'analista', ARRAY['revision','aprobacion','rechazo']);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insertar_tabla_hija
AFTER INSERT ON usuarios
FOR EACH ROW EXECUTE FUNCTION insertar_en_tabla_hija();
