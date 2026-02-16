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

CREATE INDEX idx_contactos_bancarios_estado ON contactos_bancarios(estado);
CREATE INDEX IF NOT EXISTS idx_contactos_solicitante ON contactos_bancarios(solicitante_id);
-- POLÍTICAS RLS
ALTER TABLE contactos_bancarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir a operadores ver todos los contactos
CREATE POLICY "Operadores pueden ver contactos" ON contactos_bancarios
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'operador' AND cuenta_activa = true
        )
    );

-- Política para permitir a operadores insertar contactos
CREATE POLICY "Operadores pueden insertar contactos" ON contactos_bancarios
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'operador' AND cuenta_activa = true
        )
    );

-- Política para permitir a operadores actualizar contactos
CREATE POLICY "Operadores pueden actualizar contactos" ON contactos_bancarios
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'operador' AND cuenta_activa = true
        )
    );

-- Política para permitir a operadores eliminar contactos
CREATE POLICY "Operadores pueden eliminar contactos" ON contactos_bancarios
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM usuarios 
            WHERE rol = 'operador' AND cuenta_activa = true
        )
    );