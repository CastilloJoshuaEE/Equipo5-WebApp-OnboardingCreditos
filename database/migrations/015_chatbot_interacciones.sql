CREATE TABLE IF NOT EXISTS chatbot_interacciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id),
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    sentimiento VARCHAR(20) DEFAULT 'neutro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chatbot_usuario_id ON chatbot_interacciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_created_at ON chatbot_interacciones(created_at);

