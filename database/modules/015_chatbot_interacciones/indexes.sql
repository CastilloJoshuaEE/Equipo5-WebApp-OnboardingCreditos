CREATE INDEX IF NOT EXISTS idx_chatbot_usuario_id ON chatbot_interacciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_created_at ON chatbot_interacciones(created_at);

