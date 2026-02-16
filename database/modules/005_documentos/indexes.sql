CREATE INDEX IF NOT EXISTS idx_documentos_informacion_extraida 
ON documentos USING gin (informacion_extraida);
CREATE INDEX idx_documentos_solicitud ON documentos(solicitud_id);
CREATE INDEX idx_documentos_tipo ON documentos(tipo);