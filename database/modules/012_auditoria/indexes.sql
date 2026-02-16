CREATE INDEX idx_auditoria_solicitud ON auditoria(solicitud_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(created_at DESC);
