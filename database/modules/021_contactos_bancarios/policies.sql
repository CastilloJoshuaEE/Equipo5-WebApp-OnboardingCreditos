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