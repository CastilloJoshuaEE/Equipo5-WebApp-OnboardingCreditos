CREATE INDEX IF NOT EXISTS idx_firmas_contrato ON firmas_digitales(contrato_id);
CREATE INDEX IF NOT EXISTS idx_firmas_solicitud ON firmas_digitales(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_firmas_estado ON firmas_digitales(estado);
CREATE INDEX IF NOT EXISTS idx_firmas_signature_request ON firmas_digitales(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_firmas_hash_original ON firmas_digitales(hash_documento_original);
CREATE INDEX IF NOT EXISTS idx_firmas_hash_firmado ON firmas_digitales(hash_documento_firmado);
CREATE INDEX IF NOT EXISTS idx_firmas_fecha_envio ON firmas_digitales(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_firmas_fecha_expiracion ON firmas_digitales(fecha_expiracion);
