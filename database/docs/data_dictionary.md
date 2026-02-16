# Diccionario de Datos - Nexia

Este documento detalla todas las tablas del sistema, sus columnas, tipos de datos y una breve descripción. El modelo sigue las convenciones de nomenclatura definidas y utiliza UUID como claves primarias.

---

## Tabla: `usuarios`
Tabla base que almacena la información de autenticación y datos comunes de todos los usuarios del sistema (solicitantes y operadores).

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único del usuario. PK. Default `uuid_generate_v4()`. |
| `nombre_completo` | `VARCHAR(255)` | NO | Nombre legal completo de la persona. |
| `email` | `VARCHAR(255)` | NO | Email único utilizado para el login. |
| `telefono` | `VARCHAR(20)` | SÍ | Número de teléfono de contacto. |
| `dni` | `VARCHAR(50)` | NO | Número de documento de identidad (único). |
| `password_hash` | `VARCHAR(255)` | NO | Hash de la contraseña (gestionado por backend). |
| `rol` | `VARCHAR(50)` | NO | Tipo de usuario: 'solicitante' u 'operador'. |
| `cuenta_activa` | `BOOLEAN` | NO | Indica si la cuenta está activa (para soft delete). Default `TRUE`. |
| `email_recuperacion` | `VARCHAR(255)` | SÍ | Email alternativo para recuperación de cuenta. |
| `fecha_desactivacion` | `TIMESTAMPTZ` | SÍ | Fecha en que se desactivó la cuenta. |
| `token_confirmacion` | `TEXT` | SÍ | Token para confirmación de email o reseteo de password. |
| `token_expiracion` | `TIMESTAMPTZ` | SÍ | Fecha de expiración del `token_confirmacion`. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación del registro. Default `NOW()`. |
| `updated_at` | `TIMESTAMPTZ` | NO | Fecha de la última modificación. |

---

## Tabla: `solicitantes`
Datos específicos de las PYMES que solicitan crédito. Relación 1:1 con `usuarios`.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | FK a `usuarios(id)`. PK. |
| `tipo` | `VARCHAR(20)` | NO | Tipo de entidad. Default 'empresa'. |
| `nombre_empresa` | `VARCHAR(255)` | SÍ | Razón social de la empresa. |
| `cuit` | `VARCHAR(20)` | SÍ | CUIT de la empresa (formato: XX-XXXXXXXX-X). |
| `representante_legal` | `VARCHAR(255)` | SÍ | Persona autorizada a firmar. |
| `domicilio` | `TEXT` | SÍ | Dirección fiscal de la empresa. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación del registro. |
| `updated_at` | `TIMESTAMPTZ` | NO | Fecha de la última modificación. |

---

## Tabla: `operadores`
Personal de la entidad financiera que procesa solicitudes. Relación 1:1 con `usuarios`.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | FK a `usuarios(id)`. PK. |
| `nivel` | `VARCHAR(50)` | NO | Nivel del operador: 'analista' o 'supervisor'. Default 'analista'. |
| `permisos` | `TEXT[]` | SÍ | Array de acciones permitidas (ej. 'revision', 'aprobacion'). |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación del registro. |

---

## Tabla: `solicitudes_credito`
Tabla central que representa una solicitud de crédito realizada por un solicitante.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único de la solicitud. PK. Default `uuid_generate_v4()`. |
| `numero_solicitud` | `VARCHAR(50)` | NO | Número legible para el usuario. Formato: `SOL-YYYYMMDD-XXXX`. Único. |
| `solicitante_id` | `UUID` | NO | FK a `solicitantes(id)`. Indica quién solicita. |
| `operador_id` | `UUID` | SÍ | FK a `operadores(id)`. Analista asignado a la revisión. |
| `monto` | `DECIMAL(15,2)` | NO | Monto solicitado. Debe ser > 0. |
| `moneda` | `VARCHAR(3)` | NO | Moneda ('ARS' o 'USD'). Default 'ARS'. |
| `plazo_meses` | `INTEGER` | NO | Plazo de pago en meses. Debe ser > 0. |
| `proposito` | `TEXT` | NO | Descripción del propósito del crédito. |
| `estado` | `VARCHAR(50)` | NO | Estado en el workflow: 'borrador', 'enviado', 'en_revision', 'pendiente_info', 'pendiente_firmas', 'aprobado', 'rechazado', 'cerrada'. |
| `nivel_riesgo` | `VARCHAR(20)` | SÍ | Nivel de riesgo calculado ('bajo', 'medio', 'alto'). |
| `comentarios` | `TEXT` | SÍ | Observaciones internas del operador. |
| `motivo_rechazo` | `TEXT` | SÍ | Razón del rechazo, si aplica. |
| `fecha_envio` | `TIMESTAMPTZ` | SÍ | Fecha en que el solicitante envió la solicitud. |
| `fecha_decision` | `TIMESTAMPTZ` | SÍ | Fecha en que se aprobó o rechazó. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación (borrador). |
| `updated_at` | `TIMESTAMPTZ` | NO | Fecha de última modificación. |

---

## Tabla: `documentos`
Almacena los metadatos de los documentos subidos por los solicitantes para una solicitud de crédito.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único del documento. PK. Default `uuid_generate_v4()`. |
| `solicitud_id` | `UUID` | NO | FK a `solicitudes_credito(id)`. |
| `tipo` | `VARCHAR(100)` | NO | Tipo de documento: 'dni', 'cuit', 'comprobante_domicilio', 'balance_contable', 'estado_financiero', 'declaracion_impuestos'. |
| `nombre_archivo` | `VARCHAR(255)` | NO | Nombre original del archivo subido. |
| `ruta_storage` | `TEXT` | NO | Ruta o URL completa del archivo en Supabase Storage. |
| `tamanio_bytes` | `BIGINT` | SÍ | Tamaño del archivo en bytes. |
| `estado` | `VARCHAR(50)` | NO | Estado de validación: 'pendiente', 'validado', 'rechazado'. Default 'pendiente'. |
| `comentarios` | `TEXT` | SÍ | Feedback del operador sobre el documento. |
| `informacion_extraida` | `JSONB` | SÍ | Datos estructurados extraídos del documento (ej. de DNI, CUIT). |
| `validado_en` | `TIMESTAMPTZ` | SÍ | Fecha en que se validó el documento. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de subida. |
| `updated_at` | `TIMESTAMPTZ` | SÍ | Fecha de última modificación. |

---

## Tabla: `verificaciones_kyc`
Registra las sesiones de verificación de identidad (KYC) realizadas con proveedores externos.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `solicitud_id` | `UUID` | NO | FK a `solicitudes_credito(id)`. |
| `session_id` | `VARCHAR(255)` | NO | ID de sesión único del proveedor de KYC. |
| `proveedor` | `VARCHAR(50)` | NO | Nombre del proveedor (ej. 'didit'). Default 'didit'. |
| `estado` | `VARCHAR(50)` | NO | Estado de la verificación. Default 'pendiente'. |
| `datos_verificacion` | `JSONB` | SÍ | Respuesta completa del proveedor en formato JSON. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación. |
| `actualizado_en` | `TIMESTAMPTZ` | SÍ | Fecha de última actualización. |

---

## Tabla: `condiciones_aprobacion`
Almacena condiciones especiales de aprobación asociadas a una solicitud o documento.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `solicitud_id` | `UUID` | NO | FK a `solicitudes_credito(id)`. |
| `documento_id` | `UUID` | SÍ | FK a `documentos(id)`. Condición asociada a un documento específico. |
| `condiciones` | `JSONB` | NO | Estructura JSON con las condiciones de aprobación. |
| `creado_por` | `UUID` | NO | FK a `usuarios(id)`. Usuario que creó la condición. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación. |

---

## Tabla: `solicitudes_informacion`
Gestiona las solicitudes de información adicional que un operador hace a un solicitante.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `solicitud_id` | `UUID` | NO | FK a `solicitudes_credito(id)`. |
| `informacion_solicitada` | `TEXT` | NO | Descripción de la información requerida. |
| `plazo_dias` | `INTEGER` | NO | Plazo en días para responder. Default 7. |
| `estado` | `VARCHAR(50)` | NO | Estado: 'pendiente', 'completada', etc. Default 'pendiente'. |
| `solicitado_por` | `UUID` | NO | FK a `usuarios(id)`. Operador que solicita. |
| `fecha_limite` | `TIMESTAMPTZ` | NO | Fecha tope para responder. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación. |

---

## Tabla: `contratos`
Se crea cuando una solicitud es aprobada. Relación 1:1 con `solicitudes_credito`.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `solicitud_id` | `UUID` | NO | FK a `solicitudes_credito(id)`. Único. |
| `numero_contrato` | `VARCHAR(100)` | NO | Número único del contrato. |
| `monto_aprobado` | `DECIMAL(15,2)` | NO | Monto finalmente aprobado (puede ser menor al solicitado). |
| `tasa_interes` | `DECIMAL(5,2)` | NO | Tasa de interés anual (ej. 24.50). |
| `plazo_meses` | `INTEGER` | NO | Plazo de pago en meses. |
| `tipo` | `VARCHAR(50)` | NO | Tipo de crédito: 'credito_standard', 'credito_empresa', 'credito_pyme'. |
| `estado` | `VARCHAR(50)` | NO | Estado del contrato: 'generado', 'firmado_solicitante', 'firmado_completo', 'vigente'. |
| `ruta_documento` | `TEXT` | SÍ | Ruta del PDF del contrato en Storage. |
| `firma_digital_id` | `UUID` | SÍ | FK a `firmas_digitales(id)`. Único. |
| `hash_contrato` | `VARCHAR(255)` | SÍ | Hash del contrato para verificar integridad. |
| `fecha_firma_solicitante` | `TIMESTAMPTZ` | SÍ | Fecha en que firmó el solicitante. |
| `fecha_firma_entidad` | `TIMESTAMPTZ` | SÍ | Fecha en que firmó la entidad. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de generación. |
| `updated_at` | `TIMESTAMPTZ` | SÍ | Fecha de última modificación. |

---

## Tabla: `firmas_digitales`
Gestiona el proceso de firma digital de los contratos.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `gen_random_uuid()`. |
| `contrato_id` | `UUID` | NO | FK a `contratos(id)`. |
| `solicitud_id` | `UUID` | NO | FK a `solicitudes_credito(id)`. |
| `signature_request_id` | `UUID` | SÍ | ID de la solicitud de firma en el proveedor externo. |
| `hash_documento_original` | `TEXT` | NO | Hash del documento antes de firmar. |
| `hash_documento_firmado` | `TEXT` | SÍ | Hash del documento después de firmar. |
| `integridad_valida` | `BOOLEAN` | NO | Indica si los hashes coinciden. Default `FALSE`. |
| `estado` | `VARCHAR(50)` | NO | Estado: 'pendiente', 'enviado', 'firmado_solicitante', 'firmado_operador', 'firmado_completo', 'expirado'. |
| `fecha_envio` | `TIMESTAMPTZ` | SÍ | Fecha de envío al firmante. |
| `fecha_firma_solicitante` | `TIMESTAMPTZ` | SÍ | Fecha de firma del solicitante. |
| `fecha_firma_operador` | `TIMESTAMPTZ` | SÍ | Fecha de firma del operador. |
| `fecha_firma_completa` | `TIMESTAMPTZ` | SÍ | Fecha en que ambas firmas están completas. |
| `fecha_expiracion` | `TIMESTAMPTZ` | SÍ | Fecha de expiración de la solicitud de firma. |
| `ip_firmante` | `INET` | SÍ | Dirección IP del firmante. |
| `user_agent_firmante` | `TEXT` | SÍ | User-Agent del navegador del firmante. |
| `ubicacion_firmante` | `TEXT` | SÍ | Ubicación geográfica aproximada. |
| `url_documento_firmado` | `TEXT` | SÍ | URL del documento firmado. |
| `ruta_documento` | `TEXT` | SÍ | Ruta alternativa del documento. |
| `intentos_envio` | `INTEGER` | SÍ | Número de intentos de envío. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación. |
| `updated_at` | `TIMESTAMPTZ` | NO | Fecha de última modificación. |

---

## Tabla: `auditoria_firmas`
Registro de auditoría para eventos del proceso de firma digital (cumplimiento legal).

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `gen_random_uuid()`. |
| `firma_id` | `UUID` | NO | FK a `firmas_digitales(id)`. |
| `usuario_id` | `UUID` | NO | FK a `usuarios(id)`. Usuario que realizó la acción. |
| `accion` | `VARCHAR(100)` | NO | Acción realizada (ej. 'cambio_estado', 'actualizacion_hash'). |
| `descripcion` | `TEXT` | SÍ | Descripción detallada del evento. |
| `estado_anterior` | `VARCHAR(50)` | SÍ | Estado previo al cambio. |
| `estado_nuevo` | `VARCHAR(50)` | SÍ | Estado posterior al cambio. |
| `ip_address` | `INET` | SÍ | Dirección IP desde donde se realizó la acción. |
| `user_agent` | `TEXT` | SÍ | User-Agent del navegador. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha del evento. |

---

## Tabla: `notificaciones`
Sistema de notificaciones internas para usuarios (solicitantes y operadores).

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `usuario_id` | `UUID` | NO | FK a `usuarios(id)`. Destinatario de la notificación. |
| `solicitud_id` | `UUID` | SÍ | FK a `solicitudes_credito(id)`. Opcional, para contextualizar. |
| `tipo` | `VARCHAR(50)` | NO | Tipo de notificación (ej. 'cambio_estado', 'nueva_solicitud'). |
| `titulo` | `VARCHAR(255)` | NO | Título corto de la notificación. |
| `mensaje` | `TEXT` | NO | Cuerpo del mensaje. |
| `datos_adicionales` | `JSONB` | SÍ | Datos extra para personalizar la notificación. |
| `leida` | `BOOLEAN` | NO | Indica si el usuario ya la leyó. Default `FALSE`. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación. |

---

## Tabla: `comentarios_solicitud`
Comunicación entre operador y solicitante dentro del contexto de una solicitud.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `solicitud_id` | `UUID` | NO | FK a `solicitudes_credito(id)`. |
| `usuario_id` | `UUID` | NO | FK a `usuarios(id)`. Autor del comentario. |
| `tipo` | `VARCHAR(50)` | NO | Tipo: 'operador_a_solicitante', 'solicitante_a_operador', 'interno'. |
| `comentario` | `TEXT` | NO | Contenido del mensaje. |
| `leido` | `BOOLEAN` | NO | Indica si el destinatario lo ha leído. Default `FALSE`. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha del comentario. |
| `updated_at` | `TIMESTAMPTZ` | NO | Fecha de última modificación. |

---

## Tabla: `auditoria`
Registro simple de cambios de estado en solicitudes de crédito.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `usuario_id` | `UUID` | SÍ | FK a `usuarios(id)`. Usuario que realizó el cambio (puede ser NULL). |
| `solicitud_id` | `UUID` | SÍ | FK a `solicitudes_credito(id)`. |
| `accion` | `VARCHAR(100)` | NO | Acción realizada (ej. 'cambio_estado'). |
| `detalle` | `TEXT` | SÍ | Descripción del evento. |
| `estado_anterior` | `VARCHAR(50)` | SÍ | Estado previo. |
| `estado_nuevo` | `VARCHAR(50)` | SÍ | Estado nuevo. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha del evento. |

---

## Tabla: `chatbot_interacciones`
Registro de las interacciones de los usuarios con el chatbot de soporte.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `gen_random_uuid()`. |
| `usuario_id` | `UUID` | SÍ | FK a `usuarios(id)`. Usuario que interactuó (puede ser NULL si no está logueado). |
| `pregunta` | `TEXT` | NO | Pregunta realizada por el usuario. |
| `respuesta` | `TEXT` | NO | Respuesta del chatbot. |
| `sentimiento` | `VARCHAR(20)` | NO | Análisis de sentimiento de la interacción. Default 'neutro'. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de la interacción. |
| `updated_at` | `TIMESTAMPTZ` | NO | Fecha de última modificación. |

---

## Tabla: `intentos_login`
Registro de intentos de inicio de sesión para análisis de seguridad.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `usuario_id` | `UUID` | SÍ | FK a `usuarios(id)`. Usuario asociado (si existe). |
| `email` | `VARCHAR(255)` | NO | Email utilizado en el intento. |
| `intento_exitoso` | `BOOLEAN` | NO | Indica si el login fue exitoso. Default `FALSE`. |
| `ip_address` | `VARCHAR(45)` | SÍ | Dirección IP del intento. |
| `user_agent` | `TEXT` | SÍ | User-Agent del navegador. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha del intento. |

---

## Tabla: `historial_contrasenas`
Almacena hashes de contraseñas anteriores para prevenir reutilización.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `usuario_id` | `UUID` | NO | FK a `usuarios(id)`. |
| `password_hash` | `VARCHAR(255)` | NO | Hash de la contraseña utilizada. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación (cuando se usó la contraseña). |

---

## Tabla: `plantilla_documentos`
Almacena metadatos de plantillas de documentos (ej. formatos de contrato).

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | NO | Identificador único. PK. Generado por defecto. |
| `tipo` | `TEXT` | NO | Tipo de plantilla (ej. 'contrato_credito'). |
| `nombre_archivo` | `TEXT` | NO | Nombre del archivo de plantilla. |
| `ruta_storage` | `TEXT` | NO | Ruta en Storage. |
| `tamanio_bytes` | `BIGINT` | SÍ | Tamaño del archivo. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de subida. |
| `updated_at` | `TIMESTAMPTZ` | NO | Fecha de última modificación. |

---

## Tabla: `configuraciones`
Tabla clave-valor para parámetros de configuración del sistema.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `clave` | `VARCHAR(100)` | NO | Nombre de la configuración. PK. |
| `valor` | `VARCHAR(255)` | NO | Valor de la configuración. |
| `descripcion` | `TEXT` | SÍ | Descripción de para qué sirve. |

---

## Tabla: `contactos_bancarios`
Información bancaria de los solicitantes para realizar desembolsos.

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `solicitante_id` | `UUID` | SÍ | FK a `solicitantes(id)`. Propietario de la cuenta. |
| `nombre_banco` | `VARCHAR(100)` | NO | Nombre del banco. Default 'Pichincha'. |
| `numero_cuenta` | `VARCHAR(50)` | NO | Número de cuenta bancaria. Único. |
| `tipo_cuenta` | `VARCHAR(20)` | NO | 'ahorros' o 'corriente'. Default 'ahorros'. |
| `moneda` | `VARCHAR(3)` | NO | 'USD' o 'ARS'. Default 'USD'. |
| `email_contacto` | `VARCHAR(255)` | SÍ | Email de contacto asociado a la cuenta. |
| `telefono_contacto` | `VARCHAR(20)` | SÍ | Teléfono de contacto. |
| `estado` | `VARCHAR(20)` | NO | 'activo' o 'inactivo'. Default 'activo'. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación. |
| `updated_at` | `TIMESTAMPTZ` | NO | Fecha de última modificación. |

---

## Tabla: `transferencias_bancarias`
Registro de las transferencias realizadas a los solicitantes (desembolsos).

| Campo | Tipo | Nulable | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | NO | Identificador único. PK. Default `uuid_generate_v4()`. |
| `solicitud_id` | `UUID` | NO | FK a `solicitudes_credito(id)`. |
| `contrato_id` | `UUID` | NO | FK a `contratos(id)`. |
| `contacto_bancario_id` | `UUID` | NO | FK a `contactos_bancarios(id)`. Cuenta de destino. |
| `monto` | `DECIMAL(15,2)` | NO | Monto transferido. > 0. |
| `moneda` | `VARCHAR(3)` | NO | 'USD' o 'ARS'. Default 'USD'. |
| `numero_comprobante` | `VARCHAR(100)` | SÍ | Número de comprobante de la transferencia. Único. |
| `cuenta_origen` | `VARCHAR(50)` | NO | Cuenta de origen de la entidad. Default 'NEXIA-001-USD'. |
| `banco_origen` | `VARCHAR(100)` | NO | Banco de origen. Default 'Nexia Bank'. |
| `cuenta_destino` | `VARCHAR(50)` | NO | Cuenta de destino (se replica desde `contacto_bancario` para histórico). |
| `banco_destino` | `VARCHAR(100)` | NO | Banco de destino. Default 'Banco Pichincha'. |
| `motivo` | `TEXT` | SÍ | Motivo de la transferencia. |
| `costo_transferencia` | `DECIMAL(10,2)` | NO | Costo asociado. Default 0. |
| `estado` | `VARCHAR(50)` | NO | Estado: 'pendiente', 'procesando', 'completada', 'fallida', 'reversada'. |
| `procesado_por` | `UUID` | SÍ | FK a `operadores(id)`. Operador que procesó. |
| `fecha_procesamiento` | `TIMESTAMPTZ` | SÍ | Fecha de inicio del procesamiento. |
| `fecha_completada` | `TIMESTAMPTZ` | SÍ | Fecha en que se completó. |
| `ruta_comprobante` | `TEXT` | SÍ | Ruta del comprobante en Storage. |
| `created_at` | `TIMESTAMPTZ` | NO | Fecha de creación del registro. |
| `updated_at` | `TIMESTAMPTZ` | NO | Fecha de última modificación. |