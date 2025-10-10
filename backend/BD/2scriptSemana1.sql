-- =========================================
-- TABLA SOLICITUDES_CREDITO (Core del sistema)
-- Cada registro representa una solicitud de crédito
-- Estados: borrador → enviado → en_revision → aprobado/rechazado
-- =========================================
CREATE TABLE solicitudes_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_solicitud VARCHAR(50) UNIQUE NOT NULL DEFAULT ('SOL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0')),
    
    -- ===== REFERENCIAS =====
    solicitante_id UUID NOT NULL REFERENCES solicitantes(id) ON DELETE CASCADE, -- PYME que solicita
    operador_id UUID REFERENCES operadores(id),                                 -- Analista asignado
    
    -- ===== DATOS DEL CRÉDITO =====
    monto DECIMAL(15,2) NOT NULL CHECK (monto > 0),                            -- Monto solicitado
    moneda VARCHAR(3) DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),          -- Peso argentino o USD
    plazo_meses INTEGER NOT NULL CHECK (plazo_meses > 0),                      -- Plazo de pago en meses
    proposito TEXT NOT NULL,                                                   -- Para qué necesita el crédito
    
    -- ===== WORKFLOW Y EVALUACIÓN =====
    estado VARCHAR(50) NOT NULL DEFAULT 'borrador' CHECK (estado IN 
        ('borrador', 'enviado', 'en_revision', 'pendiente_info', 'aprobado', 'rechazado')
    ),
    -- Calculado por algoritmo
     nivel_riesgo VARCHAR(20) CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto')),
    -- ===== DECISIÓN DEL OPERADOR =====
    comentarios TEXT,                                                          -- Observaciones internas
    motivo_rechazo TEXT,                                                       -- Razón si se rechaza
    
    -- Fechas
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    fecha_envio TIMESTAMPTZ,
    fecha_decision TIMESTAMPTZ
);

-- =========================================
-- TABLA DOCUMENTOS (KYC/AML)
-- Archivos que debe subir cada solicitante
-- Mínimo requerido: DNI + CUIT + Comprobante domicilio
-- =========================================
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    
    -- ===== TIPO DE DOCUMENTO =====
    tipo VARCHAR(100) NOT NULL CHECK (tipo IN (
        'dni',                    -- Documento Nacional de Identidad (OBLIGATORIO)
        'cuit',                   -- Constancia de CUIT (OBLIGATORIO)
        'comprobante_domicilio',  -- Factura luz/gas/agua (OBLIGATORIO)
        'balance_contable',       -- Balance empresa
        'estado_financiero',      -- Estado de resultados
        'declaracion_impuestos'  -- DDJJ de impuestos
    )),
    
    -- ===== ARCHIVO =====
    nombre_archivo VARCHAR(255) NOT NULL,                                     -- Nombre del archivo
    ruta_storage TEXT NOT NULL,                                               -- URL/path en Supabase Storage
    tamanio_bytes BIGINT,                                                     -- Tamaño del archivo
    
    -- ===== VALIDACIÓN =====
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'validado', 'rechazado')),
    comentarios TEXT,  
    informacion_extraida JSONB,                                                       -- Feedback del operador
    
    created_at TIMESTAMPTZ DEFAULT NOW(),                                    -- Fecha de subida
    validado_en TIMESTAMPTZ                                                   -- Fecha de validación
);
-- Tabla para verificaciones KYC
CREATE TABLE verificaciones_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    proveedor VARCHAR(50) NOT NULL DEFAULT 'didit',
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    datos_verificacion JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ
);

-- Tabla para condiciones de aprobación
CREATE TABLE condiciones_aprobacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    condiciones JSONB NOT NULL,
    creado_por UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para solicitudes de información adicional
CREATE TABLE solicitudes_informacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id) ON DELETE CASCADE,
    informacion_solicitada TEXT NOT NULL,
    plazo_dias INTEGER NOT NULL DEFAULT 7,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    solicitado_por UUID NOT NULL REFERENCES usuarios(id),
    fecha_limite TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Política para permitir a usuarios autenticados subir archivos
CREATE POLICY "Usuarios autenticados pueden subir documentos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid() IS NOT NULL
);

-- Política para permitir a usuarios autenticados ver archivos
CREATE POLICY "Cualquiera puede ver documentos kyc"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents');
CREATE POLICY "Usuarios autenticados pueden actualizar documentos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'kyc-documents');
CREATE POLICY "Usuarios autenticados pueden eliminar documentos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'kyc-documents');


-- Listar todos los buckets existentes
SELECT *
FROM storage.buckets;

-- Obtener detalles de un bucket específico por su nombre
SELECT *
FROM storage.buckets
WHERE name = 'kyc-documents';

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND (qual ILIKE '%kyc-documents%' OR with_check ILIKE '%kyc-documents%');
CREATE INDEX IF NOT EXISTS idx_documentos_informacion_extraida 
ON documentos USING gin (informacion_extraida);
SELECT id, bucket_id, owner, name
FROM storage.objects
WHERE bucket_id = 'kyc-documents'
LIMIT 10;