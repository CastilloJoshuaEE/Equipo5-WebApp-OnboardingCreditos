CREATE INDEX idx_comentarios_solicitud ON comentarios_solicitud(solicitud_id);
CREATE INDEX idx_comentarios_usuario ON comentarios_solicitud(usuario_id);
CREATE INDEX idx_comentarios_tipo ON comentarios_solicitud(tipo);
CREATE INDEX idx_comentarios_leido ON comentarios_solicitud(leido) WHERE leido = FALSE;
CREATE INDEX idx_comentarios_created_at ON comentarios_solicitud(created_at DESC);
