-- TABLA PARA CONTACTOS BANCARIOS
CREATE TABLE contactos_bancarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_banco VARCHAR(100) NOT NULL DEFAULT 'Pichincha',
    numero_cuenta VARCHAR(50) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL DEFAULT 'ahorros' CHECK (tipo_cuenta IN ('ahorros', 'corriente')),
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'ARS')),
    email_contacto VARCHAR(255),
    telefono_contacto VARCHAR(20),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Restricción única para evitar cuentas duplicadas
    UNIQUE( numero_cuenta)
);
ALTER TABLE contactos_bancarios 
ADD COLUMN IF NOT EXISTS solicitante_id UUID REFERENCES solicitantes(id);
