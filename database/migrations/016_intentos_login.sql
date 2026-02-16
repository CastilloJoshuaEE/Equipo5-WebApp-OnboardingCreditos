CREATE TABLE intentos_login (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    email VARCHAR(255) NOT NULL,
    intento_exitoso BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_intentos_login_email ON intentos_login(email);
CREATE INDEX idx_intentos_login_created_at ON intentos_login(created_at);
