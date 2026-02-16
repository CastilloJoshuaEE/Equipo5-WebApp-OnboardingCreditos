CREATE TABLE IF NOT EXISTS configuraciones (
    clave VARCHAR(100) PRIMARY KEY,
    valor VARCHAR(255) NOT NULL,
    descripcion TEXT
);
INSERT INTO configuraciones (clave, valor, descripcion) VALUES
('firma_digital_habilitada', 'true', 'Habilita el módulo de firma digital'),
('firma_digital_expiracion_dias', '7', 'Días para expirar una solicitud de firma'),
('firma_digital_max_reintentos', '3', 'Máximo número de reintentos de envío'),
('firma_digital_timezone', 'America/Mexico_City', 'Zona horaria para fechas de firma')
ON CONFLICT (clave) DO UPDATE SET 
valor = EXCLUDED.valor,
descripcion = EXCLUDED.descripcion;