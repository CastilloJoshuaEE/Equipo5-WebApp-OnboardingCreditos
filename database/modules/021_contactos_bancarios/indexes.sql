CREATE INDEX idx_contactos_bancarios_estado ON contactos_bancarios(estado);
CREATE INDEX IF NOT EXISTS idx_contactos_solicitante ON contactos_bancarios(solicitante_id);
