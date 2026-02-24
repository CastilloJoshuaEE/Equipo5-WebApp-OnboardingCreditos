// docs/swagger.schemas.js
// ==================== COMPONENTS SCHEMAS ====================

/**
 * @swagger
 * components:
 *   responses:
 *     NoAutorizado:
 *       description: No autorizado - Token inválido o expirado
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "No autorizado"
 *             error: "Token inválido o expirado"
 * 
 *     Prohibido:
 *       description: Acceso prohibido - Sin permisos suficientes
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Acceso prohibido"
 *             error: "No tiene permisos para realizar esta acción"
 * 
 *     ErrorServidor:
 *       description: Error interno del servidor
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Error interno del servidor"
 *             error: "Ha ocurrido un error inesperado"
 * 
 *   schemas:
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           description: Datos de respuesta
 *         token:
 *           type: string
 *           description: Token JWT (cuando aplica)
 * 
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         error:
 *           type: string
 *         details:
 *           type: array
 *           items:
 *             type: object
 * 
 *     Response:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 * 
 *     UsuarioRegistro:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - nombre_completo
 *         - telefono
 *         - dni
 *         - rol
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         nombre_completo:
 *           type: string
 *         telefono:
 *           type: string
 *         dni:
 *           type: string
 *         rol:
 *           type: string
 *           enum: [solicitante, operador]
 *         nombre_empresa:
 *           type: string
 *           description: Requerido para solicitantes
 *         cuit:
 *           type: string
 *           description: Requerido para solicitantes
 *         representante_legal:
 *           type: string
 *           description: Requerido para solicitantes
 *         domicilio:
 *           type: string
 *           description: Requerido para solicitantes
 * 
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 * 
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         nombre_completo:
 *           type: string
 *         telefono:
 *           type: string
 *         dni:
 *           type: string
 *         rol:
 *           type: string
 *           enum: [solicitante, operador]
 *         cuenta_activa:
 *           type: boolean
 *         email_confirmado:
 *           type: boolean
 *         activo:
 *           type: boolean
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *         nombre_empresa:
 *           type: string
 *         cuit:
 *           type: string
 *         representante_legal:
 *           type: string
 *         domicilio:
 *           type: string
 * 
 *     SolicitudCredito:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         usuario_id:
 *           type: string
 *           format: uuid
 *         monto:
 *           type: number
 *           minimum: 0.01
 *         plazo_meses:
 *           type: integer
 *           minimum: 1
 *         proposito:
 *           type: string
 *         moneda:
 *           type: string
 *           enum: [ARS, USD]
 *           default: ARS
 *         estado:
 *           type: string
 *           enum: [borrador, enviado, en_revision, pendiente_info, aprobado, rechazado]
 *         nivel_riesgo:
 *           type: string
 *           enum: [bajo, medio, alto]
 *         scoring:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         operador_asignado_id:
 *           type: string
 *           format: uuid
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *         motivo_rechazo:
 *           type: string
 *         informacion_solicitada:
 *           type: string
 *         plazo_respuesta_info:
 *           type: string
 *           format: date-time
 *         condiciones_aprobacion:
 *           type: object
 * 
 *     Documento:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         solicitud_id:
 *           type: string
 *           format: uuid
 *         nombre_archivo:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [dni, cuit, comprobante_domicilio, balance_contable, estado_financiero, declaracion_impuestos]
 *         estado:
 *           type: string
 *           enum: [pendiente, validado, rechazado]
 *         url:
 *           type: string
 *         tamano:
 *           type: integer
 *         mime_type:
 *           type: string
 *         fecha_subida:
 *           type: string
 *           format: date-time
 *         fecha_validacion:
 *           type: string
 *           format: date-time
 *         validado_por:
 *           type: string
 *           format: uuid
 *         comentarios_validacion:
 *           type: string
 *         informacion_extraida:
 *           type: object
 * 
 *     TransferenciaBancaria:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         solicitud_id:
 *           type: string
 *           format: uuid
 *         contacto_bancario_id:
 *           type: string
 *           format: uuid
 *         monto:
 *           type: number
 *         moneda:
 *           type: string
 *           enum: [ARS, USD]
 *         concepto:
 *           type: string
 *         estado:
 *           type: string
 *           enum: [pendiente, completada, fallida]
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 * 
 *     ContactoBancario:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         numero_cuenta:
 *           type: string
 *         tipo_cuenta:
 *           type: string
 *           enum: [ahorros, corriente]
 *         moneda:
 *           type: string
 *           enum: [USD, ARS]
 *         nombre_banco:
 *           type: string
 *         email_contacto:
 *           type: string
 *           format: email
 *         telefono_contacto:
 *           type: string
 * 
 *     Notificacion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         usuario_id:
 *           type: string
 *           format: uuid
 *         titulo:
 *           type: string
 *         mensaje:
 *           type: string
 *         tipo:
 *           type: string
 *           enum: [sistema, solicitud, documento, transferencia]
 *         leida:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 * 
 *     Comentario:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del comentario
 *         solicitud_id:
 *           type: string
 *           format: uuid
 *           description: ID de la solicitud asociada
 *         usuario_id:
 *           type: string
 *           format: uuid
 *           description: ID del usuario que creó el comentario
 *         tipo:
 *           type: string
 *           enum: [operador_a_solicitante, solicitante_a_operador, interno]
 *           description: Tipo de comentario
 *         comentario:
 *           type: string
 *           description: Contenido del comentario
 *         leido:
 *           type: boolean
 *           description: Indica si el comentario ha sido leído por el destinatario
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del comentario
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *         usuarios:
 *           type: object
 *           properties:
 *             nombre_completo:
 *               type: string
 *               description: Nombre completo del usuario
 *             email:
 *               type: string
 *               format: email
 *               description: Email del usuario
 *             rol:
 *               type: string
 *               enum: [solicitante, operador]
 *               description: Rol del usuario
 * 
 *     ComentarioInput:
 *       type: object
 *       required:
 *         - solicitud_id
 *         - comentario
 *       properties:
 *         solicitud_id:
 *           type: string
 *           format: uuid
 *           description: ID de la solicitud
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         comentario:
 *           type: string
 *           description: Contenido del comentario
 *           example: "Necesitamos información adicional sobre el balance contable del último trimestre."
 *         tipo:
 *           type: string
 *           enum: [operador_a_solicitante, solicitante_a_operador, interno]
 *           default: operador_a_solicitante
 *           description: Tipo de comentario
 *           example: "operador_a_solicitante"
 * 
 *     ComentariosResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comentario'
 *         total:
 *           type: integer
 *           description: Total de comentarios
 *           example: 5
 * 
 *     ContadorComentarios:
 *       type: object
 *       properties:
 *         count:
 *           type: integer
 *           description: Número de comentarios no leídos
 *           example: 3
 * 
 *     ContadorNotificaciones:
 *       type: object
 *       properties:
 *         count:
 *           type: integer
 *           description: Número de notificaciones no leídas
 *           example: 3
 * 
 *     PlantillaDocumento:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         tipo:
 *           type: string
 *           enum: [contrato, autorizacion, carta, formulario]
 *         nombre_archivo:
 *           type: string
 *         activa:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 * 
 *     VerificacionKYC:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         solicitud_id:
 *           type: string
 *           format: uuid
 *         session_id:
 *           type: string
 *         estado:
 *           type: string
 *           enum: [pendiente, aprobado, rechazado, en_proceso]
 *         proveedor:
 *           type: string
 *           enum: [didit]
 *         datos_verificacion:
 *           type: object
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 * 
 *     FirmaDigital:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         solicitud_id:
 *           type: string
 *           format: uuid
 *         contrato_id:
 *           type: string
 *           format: uuid
 *         estado:
 *           type: string
 *           enum: [pendiente, enviado, firmado_solicitante, firmado_operador, firmado_completo, expirado]
 *         fecha_envio:
 *           type: string
 *           format: date-time
 *         fecha_firma_solicitante:
 *           type: string
 *           format: date-time
 *         fecha_firma_operador:
 *           type: string
 *           format: date-time
 *         fecha_expiracion:
 *           type: string
 *           format: date-time
 *         hash_documento_original:
 *           type: string
 *         hash_documento_firmado:
 *           type: string
 *         url_documento_firmado:
 *           type: string
 *         integridad_valida:
 *           type: boolean
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */