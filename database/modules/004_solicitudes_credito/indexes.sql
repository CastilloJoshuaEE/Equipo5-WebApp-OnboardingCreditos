CREATE INDEX idx_solicitudes_solicitante ON solicitudes_credito(solicitante_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_credito(estado);
CREATE INDEX idx_solicitudes_fecha ON solicitudes_credito(created_at DESC);
