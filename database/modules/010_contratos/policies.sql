ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso a documentos de contratos
CREATE POLICY "acceso_documentos_contratos_solicitante" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' 
  AND (
    -- Solicitantes pueden ver sus propios documentos
    (auth.uid()::text IN (
      SELECT sc.solicitante_id::text 
      FROM solicitudes_credito sc
      JOIN contratos c ON c.solicitud_id = sc.id
      WHERE storage.objects.name LIKE '%' || c.id::text || '%'
    ))
    OR
    -- Operadores pueden ver todos los documentos
    auth.uid() IN (SELECT id FROM usuarios WHERE rol = 'operador')
  )
);


CREATE POLICY "contratos_acceso_solicitante" ON contratos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc
            WHERE sc.id = contratos.solicitud_id
            AND sc.solicitante_id::text = auth.uid()::text
        )
    );

CREATE POLICY "contratos_acceso_operador" ON contratos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM solicitudes_credito sc
            WHERE sc.id = contratos.solicitud_id
            AND sc.operador_id::text = auth.uid()::text
        )
    );

CREATE POLICY "contratos_acceso_admin" ON contratos
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "contratos_insert"
ON contratos
FOR INSERT
WITH CHECK (
  -- Permitir si el usuario es el operador o solicitante de la solicitud
  EXISTS (
    SELECT 1 FROM solicitudes_credito sc
    WHERE sc.id = contratos.solicitud_id
    AND (
      sc.operador_id::text = auth.uid()::text
      OR sc.solicitante_id::text = auth.uid()::text
    )
  )
  OR
  -- Permitir al rol de servicio
  auth.role() = 'service_role'
  OR
  -- Permitir al usuario postgres interno (funciones del backend)
  current_user = 'postgres'
);

CREATE POLICY "contratos_select"
ON contratos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM solicitudes_credito sc
    WHERE sc.id = contratos.solicitud_id
    AND (
      sc.operador_id::text = auth.uid()::text
      OR sc.solicitante_id::text = auth.uid()::text
    )
  )
  OR auth.role() = 'service_role'
);

CREATE POLICY "contratos_update"
ON contratos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM solicitudes_credito sc
    WHERE sc.id = contratos.solicitud_id
    AND (
      sc.operador_id::text = auth.uid()::text
      OR sc.solicitante_id::text = auth.uid()::text
    )
  )
  OR auth.role() = 'service_role'
);


-- Permitir a operadores ver todos los contratos
CREATE POLICY "operadores_ver_contratos" ON contratos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() AND rol = 'operador'
  )
);

