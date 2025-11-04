const express = require("express");
const { supabase } = require('../config/conexion');
const AuthMiddleware = require("../middleware/auth");
const authController = require("../controladores/authController");
const usuariosController = require("../controladores/UsuarioController");
const confirmacionController = require("../controladores/confirmacionController");
const notificacionesController = require("../controladores/NotificacionesController");
const SolicitudesController = require('../controladores/SolicitudesController');
const OperadorController = require('../controladores/OperadorController');
const DocumentoController = require('../controladores/DocumentoController');
const reactivacionController = require('../controladores/reactivacionController');
const webhooksController = require('../controladores/webhooksController'); 
const ComentariosController = require('../controladores/ComentariosController');
const PlantillasDocumentoController = require('../controladores/PlantillasDocumentosController');
const ChatbotController = require('../controladores/ChatbotController');
const FirmaDigitalController = require('../controladores/FirmaDigitalController');
const ContratoController = require("../controladores/ContratoController");
const ContactosBancariosController= require("../controladores/ContactosBancariosController");

const TransferenciasBancariasController= require("../controladores/TransferenciasBancariasController");
const WordService= require("../servicios/WordService");
const emailValidator = require("../servicios/emailValidarServicio");

// Middleware existentes
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
router.get("/airSlate", (req, res) => res.status(200).send("OK"));

router.post("/airSlate", (req, res) => {
    console.log("Webhook recibido:", req.body);
    res.status(200).json({ success: true });
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: (req, file, cb) => {
const allowedTypes = [
  'application/pdf',
  'application/msword',//  .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/jpeg',
  'image/jpg',
  'image/png'
];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo DOCX, PDF'), false);
    }
  }
});

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
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             count:
 *               type: integer
 *               description: Número de comentarios no leídos
 *               example: 3
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
/**
 * @swagger
 * tags:
 *   - name: Autenticación
 *     description: Endpoints de autenticación y gestión de usuarios
 *   - name: Confirmación
 *     description: Endpoints de confirmación de email
 *   - name: Usuario
 *     description: Endpoints de gestión de perfil de usuario
 *   - name: Contraseña
 *     description: Endpoints de gestión de contraseñas
 *   - name: Cuenta
 *     description: Endpoints de gestión de cuenta
 *   - name: Administración
 *     description: Endpoints administrativos
 *   - name: Solicitudes
 *     description: Endpoints de gestión de solicitudes de crédito
 *   - name: Documentos
 *     description: Endpoints de gestión de documentos
 *   - name: Operadores
 *     description: Endpoints específicos para operadores
 *   - name: KYC/AML
 *     description: Endpoints de verificación KYC/AML
 *   - name: Comentarios
 *     description: Endpoints para gestión de comentarios entre operadores y solicitantes
 *   - name: Estadísticas
 *     description: Endpoints de estadísticas del sistema
 *   - name: Webhooks
 *     description: Endpoints para webhooks externos
 *   - name: Notificaciones
 *     description: Endpoints de gestión de notificaciones
 * 
 * @swagger
 * security:
 *   - bearerAuth: []
 */
// ==================== RUTAS DE CONFIRMACIÓN ====================

/**
 * @swagger
 * /api/auth/confirmar:
 *   get:
 *     summary: Confirmar email de usuario
 *     tags: [Confirmación]
 *     description: Confirma el email de un usuario mediante un token enviado por correo
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de confirmación enviado por email
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email del usuario a confirmar
 *     responses:
 *       200:
 *         description: Email confirmado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/auth/confirmar", confirmacionController.confirmarEmail);

/**
 * @swagger
 * /api/auth/reenviar-confirmacion:
 *   post:
 *     summary: Reenviar email de confirmación
 *     tags: [Confirmación]
 *     description: Reenvía el email de confirmación a un usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *             example:
 *               email: "usuario@ejemplo.com"
 *     responses:
 *       200:
 *         description: Email de confirmación reenviado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email no válido o ya confirmado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/auth/reenviar-confirmacion",
  confirmacionController.reenviarConfirmacion
);

/**
 * @swagger
 * /api/usuarios/verificar-email:
 *   post:
 *     summary: Verificar validez de email
 *     tags: [Confirmación]
 *     description: Verifica si un email es válido usando servicios externos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email a verificar
 *             example:
 *               email: "usuario@ejemplo.com"
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     validation:
 *                       type: object
 *                       description: Resultado de la validación del email
 *       400:
 *         description: Email no válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/usuarios/verificar-email",  emailValidator.verifyEmailOnly, (req, res) => {
  res.json({
    success: true,
    message: "Verificación de email completada",
    validation: req.emailValidation,
  });
});

// ==================== RUTAS PÚBLICAS ====================

/**
 * @swagger
 * /api/usuarios/registro:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
 *     description: Registra un nuevo usuario en el sistema. Para solicitantes se requieren datos adicionales de empresa.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioRegistro'
 *           examples:
 *             solicitante:
 *               summary: Registro de solicitante
 *               value:
 *                 email: "juan@hotmail.com"
 *                 password: "tucontrasena123"
 *                 nombre_completo: "Joshúa Castillo"
 *                 telefono: "0111111111"
 *                 dni: "0111111111"
 *                 rol: "solicitante"
 *                 nombre_empresa: "mi empresa SA"
 *                 cuit: "30-12345678-9"
 *                 representante_legal: "Joshúa Castillo"
 *                 domicilio: "Calle 123"
 *             operador:
 *               summary: Registro de operador
 *               value:
 *                 email: "operador@hotmail.com"
 *                 password: "operador123"
 *                 nombre_completo: "Carlos Operador"
 *                 telefono: "0912345678"
 *                 dni: "0888888818"
 *                 rol: "operador"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         usuario:
 *                           $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/usuarios/registro",
  emailValidator.validateEmailBeforeAuth,
  usuariosController.registrar
);

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Autenticación]
 *     description: Autentica un usuario y devuelve un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Token JWT para autenticación
 *                     data:
 *                       type: object
 *                       properties:
 *                         usuario:
 *                           $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/usuarios/login", authController.login);

/**
 * @swagger
 * /api/usuarios/logout:
 *   post:
 *     summary: Salir
 *     tags: [Autenticación]
 *     description: Cierra la sesión del usuario (invalida el token)
 *     responses:
 *       200:
 *         description: Logout exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/usuarios/logout", authController.logout);

/**
 * @swagger
 * /api/usuarios/session:
 *   get:
 *     summary: Verificar sesión activa
 *     tags: [Autenticación]
 *     description: Verifica si hay una sesión de usuario activa
 *     security: []
 *     responses:
 *       200:
 *         description: Información de sesión
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         usuario:
 *                           $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: Sin sesión activa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/usuarios/session", authController.getSession);
/**
 * @swagger
 * /api/auth/restablecer-cuenta:
 *   get:
 *     summary: Procesar recuperación de cuenta
 *     tags: [Cuenta]
 *     description: Procesa el token de recuperación para reactivar una cuenta desactivada
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de recuperación
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email del usuario
 *     responses:
 *       302:
 *         description: Redirección al frontend con resultado
 */
router.get("/auth/restablecer-cuenta", reactivacionController.procesarRecuperacionCuenta);
/**
 * @swagger
 * /api/usuarios/recuperar-contrasena:
 *   post:
 *     summary: Recuperar contraseña
 *     tags: [Contraseña]
 *     description: Permite restablecer la contraseña de un usuario sin necesidad de autenticación.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - nueva_contrasena
 *               - confirmar_contrasena
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario
 *               nueva_contrasena:
 *                 type: string
 *                 description: Nueva contraseña
 *               confirmar_contrasena:
 *                 type: string
 *                 description: Confirmación de la nueva contraseña
 *             example:
 *               email: "usuario@ejemplo.com"
 *               nueva_contrasena: "nueva1234"
 *               confirmar_contrasena: "nueva1234"
 *     responses:
 *       200:
 *         description: Contraseña recuperada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Error en la recuperación (email inválido o contraseñas no coinciden)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/usuarios/recuperar-contrasena', usuariosController.recuperarContrasena);

/**
 * @swagger
 * /api/usuario/cambiar-contrasena:
 *   put:
 *     summary: Cambiar contraseña (usuario autenticado)
 *     tags: [Contraseña]
 *     description: Permite a un usuario autenticado cambiar su contraseña actual por una nueva.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contrasena_actual
 *               - nueva_contrasena
 *               - confirmar_contrasena
 *             properties:
 *               contrasena_actual:
 *                 type: string
 *                 description: Contraseña actual
 *               nueva_contrasena:
 *                 type: string
 *                 description: Nueva contraseña
 *               confirmar_contrasena:
 *                 type: string
 *                 description: Confirmación de la nueva contraseña
 *             example:
 *               contrasena_actual: "vieja123"
 *               nueva_contrasena: "nueva456"
 *               confirmar_contrasena: "nueva456"
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Error en el cambio de contraseña
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Usuario no autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/usuario/cambiar-contrasena', AuthMiddleware.proteger, usuariosController.cambiarContrasena);
/**
 * @swagger
 * /api/usuario/estado-confirmacion:
 *   get:
 *     summary: Verificar estado de confirmación de email
 *     tags: [Usuario]
 *     description: Obtiene el estado de confirmación del email del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de confirmación obtenido
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         email_confirmado:
 *                           type: boolean
 *                           description: Estado de confirmación del email
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/usuario/estado-confirmacion",
  AuthMiddleware.proteger,
  confirmacionController.estadoConfirmacionEmail
);

/**
 * @swagger
 * /api/usuario/perfil:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Usuario]
 *     description: Obtiene el perfil completo del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         usuario:
 *                           $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/usuario/perfil", AuthMiddleware.proteger, usuariosController.obtenerPerfil);
/**
 * @swagger
 * /api/usuario/editar-perfil:
 *   put:
 *     summary: Editar perfil del usuario autenticado
 *     tags: [Usuario]
 *     description: Permite al usuario autenticado editar su perfil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_completo:
 *                 type: string
 *                 description: Nombre completo del usuario
 *               telefono:
 *                 type: string
 *                 description: Número de teléfono
 *               direccion:
 *                 type: string
 *                 description: Dirección personal
 *               nombre_empresa:
 *                 type: string
 *                 description: Nombre de la empresa (solo solicitantes)
 *               cuit:
 *                 type: string
 *                 description: CUIT de la empresa (solo solicitantes)
 *               representante_legal:
 *                 type: string
 *                 description: Representante legal (solo solicitantes)
 *               domicilio:
 *                 type: string
 *                 description: Domicilio de la empresa (solo solicitantes)
 *             example:
 *               nombre_completo: "Juan Pérez Actualizado"
 *               telefono: "+5491112345678"
 *               direccion: "Calle Principal 123"
 *               nombre_empresa: "Mi Empresa SA Actualizada"
 *               cuit: "30-12345678-9"
 *               representante_legal: "Juan Pérez"
 *               domicilio: "Av. Siempre Viva 742"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.put("/usuario/editar-perfil", AuthMiddleware.proteger, usuariosController.actualizarPerfil);

/**
 * @swagger
 * /api/usuarios/{id}/perfil-publico:
 *   get:
 *     summary: Obtener perfil público de usuario por ID
 *     tags: [Administración]
 *     description: Obtiene el perfil público de cualquier usuario por su ID (requiere rol de operador)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Perfil público obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         usuario:
 *                           $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (requiere rol de operador)
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
    "/usuarios/:id/perfil-publico",
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar("operador"),
    usuariosController.obtenerPerfilUsuario
);
/**
 * @swagger
 * /api/usuario/desactivar-cuenta:
 *   put:
 *     summary: Desactivar cuenta del usuario autenticado
 *     tags: [Usuario]
 *     description: Desactiva la cuenta del usuario autenticado (requiere confirmación con contraseña)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Contraseña actual para confirmar la desactivación
 *               motivo:
 *                 type: string
 *                 description: Motivo opcional para la desactivación
 *     responses:
 *       200:
 *         description: Cuenta desactivada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Contraseña incorrecta o datos inválidos
 *       401:
 *         description: No autorizado
 */
router.put(
  "/usuario/desactivar-cuenta",
  AuthMiddleware.proteger,
  usuariosController.desactivarCuenta
);
/**
 * @swagger
 * /api/usuario/configuracion-cuenta:
 *   get:
 *     summary: Obtener configuración de cuenta del usuario
 *     tags: [Usuario]
 *     description: Obtiene la configuración de cuenta incluyendo email de recuperación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración de cuenta obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         email_principal:
 *                           type: string
 *                         email_recuperacion:
 *                           type: string
 *                         cuenta_activa:
 *                           type: boolean
 *                         fecha_desactivacion:
 *                           type: string
 *       401:
 *         description: No autorizado
 */
router.get("/usuario/configuracion-cuenta", AuthMiddleware.proteger, usuariosController.obtenerConfiguracionCuenta);
/**
 * @swagger
 * /api/usuario/solicitar-reactivacion:
 *   post:
 *     summary: Solicitar reactivación de cuenta inactiva
 *     tags: [Cuenta]
 *     description: Solicita un enlace de reactivación para una cuenta desactivada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de reactivación enviado exitosamente
 *       400:
 *         description: Email no válido
 */
router.post("/usuario/solicitar-reactivacion", reactivacionController.solicitarReactivacionCuenta);

/**
 * @swagger
 * /api/usuario/email-recuperacion:
 *   put:
 *     summary: Actualizar email de recuperación
 *     tags: [Usuario]
 *     description: Establece o actualiza el email de recuperación para la cuenta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email_recuperacion
 *             properties:
 *               email_recuperacion:
 *                 type: string
 *                 format: email
 *                 description: Email alternativo para recuperación de cuenta
 *     responses:
 *       200:
 *         description: Email de recuperación actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email no válido
 *       401:
 *         description: No autorizado
 */
router.put("/usuario/email-recuperacion", AuthMiddleware.proteger, usuariosController.actualizarEmailRecuperacion);

/**
 * @swagger
 * /api/usuario/estado-cuenta:
 *   get:
 *     summary: Verificar estado de la cuenta
 *     tags: [Usuario]
 *     description: Obtiene información sobre el estado de activación y email de recuperación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de cuenta obtenido
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         cuenta_activa:
 *                           type: boolean
 *                         fecha_desactivacion:
 *                           type: string
 *                         email_recuperacion:
 *                           type: string
 *                         tiene_email_recuperacion:
 *                           type: boolean
 *       401:
 *         description: No autorizado
 */
router.get("/usuario/estado-cuenta", AuthMiddleware.proteger, usuariosController.verificarEstadoCuenta);
// ==================== RUTAS PARA ADMINISTRADORES ====================

/**
 * @swagger
 * /api/usuarios/{id}/perfil:
 *   get:
 *     summary: Obtener perfil de usuario por ID (Solo operadores)
 *     tags: [Administración]
 *     description: Obtiene el perfil de cualquier usuario por su ID (requiere rol de operador)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         usuario:
 *                           $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos (requiere rol de operador)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/usuarios/:id/perfil",
  AuthMiddleware.proteger,
  AuthMiddleware.autorizar("operador"),
  usuariosController.obtenerPerfilPorId
);

/**
 * @swagger
 * /api/usuarios/{id}/perfil:
 *   put:
 *     summary: Actualizar perfil de usuario por ID (Solo operadores)
 *     tags: [Administración]
 *     description: Actualiza el perfil de cualquier usuario por su ID (requiere rol de operador)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_completo:
 *                 type: string
 *                 description: Nombre completo del usuario
 *               telefono:
 *                 type: string
 *                 description: Número de teléfono
 *               dni:
 *                 type: string
 *                 description: Documento de identidad
 *               rol:
 *                 type: string
 *                 enum: [solicitante, operador]
 *                 description: Rol del usuario
 *               activo:
 *                 type: boolean
 *                 description: Estado activo del usuario
 *             example:
 *               nombre_completo: "Usuario Actualizado"
 *               telefono: "+573001234567"
 *               dni: "12345678"
 *               rol: "solicitante"
 *               activo: true
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         usuario:
 *                           $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos (requiere rol de operador)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/usuarios/:id/perfil",
  AuthMiddleware.proteger,
  AuthMiddleware.autorizar("operador"),
  usuariosController.actualizarPerfilPorId
);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Dashboard administrativo (Solo operadores)
 *     tags: [Administración]
 *     description: Accede al dashboard administrativo (requiere rol de operador)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acceso al dashboard exitoso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         usuario:
 *                           type: string
 *                           description: Nombre del operador
 *                         rol:
 *                           type: string
 *                           description: Rol del usuario
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Sin permisos (requiere rol de operador)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/admin/dashboard", AuthMiddleware.proteger, AuthMiddleware.autorizar("operador"), (req, res) => {
  res.json({
    success: true,
    message: "Dashboard administrativo",
    data: {
      usuario: req.usuario.nombre_completo,
      rol: req.usuario.rol,
    },
  });
});

// ==================== RUTAS DE AUTENTICACIÓN ====================

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refrescar token de acceso
 *     tags: [Autenticación]
 *     description: Refresca el token de acceso usando el refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Refresh token válido
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                         refresh_token:
 *                           type: string
 *                         expires_at:
 *                           type: integer
 *       400:
 *         description: Refresh token no proporcionado
 *       401:
 *         description: Refresh token inválido o expirado
 */
router.post("/auth/refresh", authController.refreshToken);

// ==================== RUTAS DE SOLICITUDES ====================

/**
 * @swagger
 * /api/solicitudes:
 *   post:
 *     summary: Crear nueva solicitud de crédito
 *     tags: [Solicitudes]
 *     description: Crea una nueva solicitud de crédito en estado borrador
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monto
 *               - plazo_meses
 *               - proposito
 *             properties:
 *               monto:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Monto solicitado
 *               plazo_meses:
 *                 type: integer
 *                 minimum: 1
 *                 description: Plazo en meses
 *               proposito:
 *                 type: string
 *                 minLength: 10
 *                 description: Propósito del crédito
 *               moneda:
 *                 type: string
 *                 enum: [ARS, USD]
 *                 default: ARS
 *     responses:
 *       201:
 *         description: Solicitud creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SolicitudCredito'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 * 
 *   get:
 *     summary: Obtener mis solicitudes (Solicitante) o todas las solicitudes (Operador)
 *     tags: [Solicitudes]
 *     description: Dependiendo del rol, obtiene las solicitudes del usuario o todas las solicitudes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [borrador, enviado, en_revision, pendiente_info, aprobado, rechazado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: nivel_riesgo
 *         schema:
 *           type: string
 *           enum: [bajo, medio, alto]
 *         description: Filtrar por nivel de riesgo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Límite de resultados por página
 *     responses:
 *       200:
 *         description: Lista de solicitudes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SolicitudCredito'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (para operadores)
 */
router.post('/solicitudes', AuthMiddleware.proteger, SolicitudesController.crearSolicitud);
router.get('/solicitudes', AuthMiddleware.proteger, SolicitudesController.obtenerMisSolicitudes);

/**
 * @swagger
 * /api/solicitudes/mis-solicitudes:
 *   get:
 *     summary: Obtener mis solicitudes (Solicitante)
 *     tags: [Solicitudes]
 *     description: Obtiene todas las solicitudes del solicitante autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SolicitudCredito'
 *       401:
 *         description: No autorizado
 */
router.get('/solicitudes/mis-solicitudes', AuthMiddleware.proteger, SolicitudesController.obtenerMisSolicitudes);

/**
 * @swagger
 * /api/solicitudes/{solicitud_id}/enviar:
 *   put:
 *     summary: Enviar solicitud para revisión
 *     tags: [Solicitudes]
 *     description: Envía una solicitud en borrador para revisión por operadores
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     responses:
 *       200:
 *         description: Solicitud enviada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SolicitudCredito'
 *       400:
 *         description: Documentos obligatorios faltantes
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Solicitud no encontrada
 */
router.put('/solicitudes/:solicitud_id/enviar', AuthMiddleware.proteger, SolicitudesController.enviarSolicitud);
/**
 * @swagger
 * /api/solicitudes/mis-solicitudes-con-documentos:
 *   get:
 *     summary: Obtener mis solicitudes con documentos disponibles
 *     tags: [Solicitudes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de solicitudes con documentos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/solicitudes/mis-solicitudes-con-documentos', 
  AuthMiddleware.proteger, 
  DocumentoController.obtenerMisSolicitudesConDocumentos
);
// En tus rutas
router.get('/mis-transferencias', 
 AuthMiddleware.proteger,     TransferenciasBancariasController.obtenerMisTransferencias
);
/**
 * @swagger
 * /api/solicitudes/{solicitud_id}:
 *   get:
 *     summary: Obtener detalle de una solicitud
 *     tags: [Solicitudes]
 *     description: Obtiene el detalle completo de una solicitud específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     responses:
 *       200:
 *         description: Detalle de solicitud obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SolicitudCredito'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos para ver esta solicitud
 *       404:
 *         description: Solicitud no encontrada
 */
router.get('/solicitudes/:solicitud_id', AuthMiddleware.proteger, SolicitudesController.obtenerSolicitudDetalle);

/**
 * @swagger
 * /api/solicitudes/{solicitud_id}/documentos:
 *   get:
 *     summary: Obtener documentos de una solicitud
 *     tags: [Documentos]
 *     description: Obtiene todos los documentos asociados a una solicitud
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     responses:
 *       200:
 *         description: Lista de documentos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Documento'
 *       401:
 *         description: No autorizado
 * 
 *   post:
 *     summary: Subir documento a una solicitud
 *     tags: [Documentos]
 *     description: Sube un documento a una solicitud específica
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - archivo
 *               - tipo
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir (PDF máximo 5MB)
 *               tipo:
 *                 type: string
 *                 enum: [dni, cuit, comprobante_domicilio, balance_contable, estado_financiero, declaracion_impuestos]
 *                 description: Tipo de documento
 *     responses:
 *       201:
 *         description: Documento subido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         documento:
 *                           $ref: '#/components/schemas/Documento'
 *                         url_publica:
 *                           type: string
 *                         informacion_extraida:
 *                           type: object
 *       400:
 *         description: Datos inválidos o archivo no válido
 *       401:
 *         description: No autorizado
 *       413:
 *         description: Archivo demasiado grande
 */
router.get('/solicitudes/:solicitud_id/documentos', AuthMiddleware.proteger, DocumentoController.obtenerDocumentosSolicitud);
router.post(
  '/solicitudes/:solicitud_id/documentos',
  AuthMiddleware.proteger,
  AuthMiddleware.autorizar('solicitante'),
  upload.single('archivo'),
  DocumentoController.subirDocumento 
);

// Rutas para operadores
router.get('/solicitudes', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), SolicitudesController.obtenerTodasSolicitudes);

/**
 * @swagger
 * /api/solicitudes/{solicitud_id}/asignar:
 *   put:
 *     summary: Asignar operador a solicitud
 *     tags: [Operadores]
 *     description: Asigna un operador a una solicitud para revisión
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operador_id
 *             properties:
 *               operador_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID del operador a asignar
 *     responses:
 *       200:
 *         description: Operador asignado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SolicitudCredito'
 *       400:
 *         description: ID de operador no proporcionado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo operadores)
 *       404:
 *         description: Solicitud no encontrada
 */
router.put('/solicitudes/:solicitud_id/asignar', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), SolicitudesController.asignarOperador);

/**
 * @swagger
 * /api/solicitudes/{solicitud_id}/aprobar:
 *   put:
 *     summary: Aprobar solicitud de crédito
 *     tags: [Operadores]
 *     description: Aprueba una solicitud de crédito
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comentarios:
 *                 type: string
 *                 description: Comentarios de aprobación
 *               condiciones:
 *                 type: object
 *                 description: Condiciones de aprobación
 *     responses:
 *       200:
 *         description: Solicitud aprobada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SolicitudCredito'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo operadores)
 *       404:
 *         description: Solicitud no encontrada
 */
router.put('/solicitudes/:solicitud_id/aprobar', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), SolicitudesController.aprobarSolicitud);

/**
 * @swagger
 * /api/solicitudes/{solicitud_id}/rechazar:
 *   put:
 *     summary: Rechazar solicitud de crédito
 *     tags: [Operadores]
 *     description: Rechaza una solicitud de crédito
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - motivo_rechazo
 *             properties:
 *               motivo_rechazo:
 *                 type: string
 *                 description: Motivo del rechazo
 *     responses:
 *       200:
 *         description: Solicitud rechazada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SolicitudCredito'
 *       400:
 *         description: Motivo de rechazo no proporcionado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo operadores)
 *       404:
 *         description: Solicitud no encontrada
 */
router.put('/solicitudes/:solicitud_id/rechazar', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), SolicitudesController.rechazarSolicitud);

/**
 * @swagger
 * /api/solicitudes/{solicitud_id}/solicitar-info:
 *   put:
 *     summary: Solicitar información adicional
 *     tags: [Operadores]
 *     description: Solicita información adicional al solicitante
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - informacion_solicitada
 *             properties:
 *               informacion_solicitada:
 *                 type: string
 *                 description: Información solicitada
 *               plazo_dias:
 *                 type: integer
 *                 minimum: 1
 *                 default: 7
 *                 description: Plazo en días para responder
 *     responses:
 *       200:
 *         description: Información adicional solicitada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SolicitudCredito'
 *       400:
 *         description: Información solicitada no proporcionada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo operadores)
 *       404:
 *         description: Solicitud no encontrada
 */
router.put('/solicitudes/:solicitud_id/solicitar-info', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), SolicitudesController.solicitarInformacionAdicional);

/**
 * @swagger
 * /api/documentos/{documento_id}/validar:
 *   put:
 *     summary: Validar documento (Operador)
 *     tags: [Documentos]
 *     description: Valida o rechaza un documento subido
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documento_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del documento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [validado, rechazado]
 *                 description: Nuevo estado del documento
 *               comentarios:
 *                 type: string
 *                 description: Comentarios de validación
 *     responses:
 *       200:
 *         description: Documento validado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Documento'
 *       400:
 *         description: Estado inválido
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo operadores)
 *       404:
 *         description: Documento no encontrada
 */
router.put('/documentos/:documento_id/validar', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), DocumentoController.validarDocumento);
/**
 * @swagger
 * /api/documentos/{documento_id}/evaluar:
 *   post:
 *     summary: Evaluar documento con criterios específicos
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documento_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - criterios
 *             properties:
 *               criterios:
 *                 type: object
 *                 description: "Criterios evaluados (clave: valor booleano)"
 *               comentarios:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum: [validado, pendiente, rechazado]
 *     responses:
 *       200:
 *         description: Documento evaluado exitosamente
 */
router.post('/documentos/:documento_id/evaluar', 
    AuthMiddleware.proteger, 
    AuthMiddleware.autorizar('operador'), 
    DocumentoController.evaluarDocumento
);
/**
 * @swagger
 * /api/solicitudes/{solicitud_id}/verificar-kyc:
 *   post:
 *     summary: Iniciar verificación KYC
 *     tags: [KYC/AML]
 *     description: Inicia el proceso de verificación KYC con Didit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     responses:
 *       200:
 *         description: Verificación KYC iniciada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         verificationUrl:
 *                           type: string
 *                         sessionId:
 *                           type: string
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Solicitud no encontrada
 */
router.post('/solicitudes/:solicitud_id/verificar-kyc', AuthMiddleware.proteger, SolicitudesController.iniciarVerificacionKYC);

/**
 * @swagger
 * /api/estadisticas:
 *   get:
 *     summary: Obtener estadísticas del sistema
 *     tags: [Estadísticas]
 *     description: Obtiene estadísticas del sistema para el dashboard de operadores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalSolicitudes:
 *                           type: integer
 *                         porEstado:
 *                           type: object
 *                         porRiesgo:
 *                           type: object
 *                         solicitudesUltimoMes:
 *                           type: integer
 *                         montoTotalAprobado:
 *                           type: number
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo operadores)
 */
router.get('/estadisticas', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), SolicitudesController.obtenerEstadisticas);
/**
 * @swagger
 * /api/documentos/{documento_id}/descargar:
 *   get:
 *     summary: Descargar documento
 *     description: Descarga un documento específico del sistema de almacenamiento
 *     tags:
 *       - Documentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documento_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del documento
 *     responses:
 *       '200':
 *         description: Documento descargado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Documento no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/documentos/:documento_id/descargar', AuthMiddleware.proteger, DocumentoController.descargarDocumento);
/**
 * @swagger
 * /api/documentos/{documento_id}:
 *   put:
 *     summary: Actualizar documento existente
 *     tags: [Documentos]
 *     description: Reemplaza un documento existente por uno nuevo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documento_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del documento a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - archivo
 *               - tipo
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Nuevo archivo a subir
 *               tipo:
 *                 type: string
 *                 enum: [dni, cuit, comprobante_domicilio, balance_contable, estado_financiero, declaracion_impuestos]
 *                 description: Tipo de documento
 *     responses:
 *       200:
 *         description: Documento actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Documento no encontrado
 */
router.put(
  '/documentos/:documento_id',
  AuthMiddleware.proteger,
  AuthMiddleware.autorizar('solicitante'),
  upload.single('archivo'),
  DocumentoController.actualizarDocumento
);

/**
 * @swagger
 * /api/documentos/{documento_id}:
 *   delete:
 *     summary: Eliminar documento
 *     description: Elimina un documento del sistema (solo para solicitantes)
 *     tags:
 *       - Documentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documento_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del documento a eliminar
 *     responses:
 *       '200':
 *         description: Documento eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Documento no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.delete(
  '/documentos/:documento_id',
  AuthMiddleware.proteger,
  AuthMiddleware.autorizar('solicitante'),
  DocumentoController.eliminarDocumento
);

/**
 * @swagger
 * /api/documentos/{documento_id}/historial-evaluaciones:
 *   get:
 *     summary: Obtener historial de evaluaciones de documento
 *     description: Obtiene el historial completo de evaluaciones y criterios aplicados a un documento
 *     tags:
 *       - Documentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documento_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID único del documento
 *     responses:
 *       '200':
 *         description: Historial obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           criterios:
 *                             type: object
 *                             additionalProperties:
 *                               type: boolean
 *                           comentarios:
 *                             type: string
 *                           estado_final:
 *                             type: string
 *                             enum: [validado, rechazado, pendiente]
 *                           porcentaje_aprobado:
 *                             type: number
 *                             format: float
 *                           fecha_evaluacion:
 *                             type: string
 *                             format: date-time
 *                           evaluado_por:
 *                             $ref: '#/components/schemas/Usuario'
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '404':
 *         description: Documento no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/documentos/:documento_id/historial-evaluaciones', DocumentoController.obtenerHistorialEvaluaciones);

/**
 * @swagger
 * /api/webhooks/didit:
 *   post:
 *     summary: Webhook para recibir notificaciones de Didit
 *     tags: [Webhooks]
 *     description: Endpoint público para recibir webhooks de Didit sobre verificaciones KYC
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: ID de sesión de Didit
 *               status:
 *                 type: string
 *                 description: Estado de la verificación
 *               webhook_type:
 *                 type: string
 *                 description: Tipo de webhook
 *               decision:
 *                 type: object
 *                 description: Decisión de la verificación
 *     responses:
 *       200:
 *         description: Webhook procesado exitosamente
 *       401:
 *         description: Firma de webhook inválida
 *       404:
 *         description: Verificación no encontrada
 */
router.post('/webhooks/didit',  webhooksController.handleDiditWebhook);

/**
 * @swagger
 * /api/operador/dashboard:
 *   get:
 *     summary: Obtener dashboard del operador
 *     tags: [Operador]
 *     description: Obtiene las solicitudes asignadas al operador con filtros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [en_revision, pendiente_info, aprobado, rechazado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: fecha_desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar desde fecha
 *       - in: query
 *         name: fecha_hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar hasta fecha
 *       - in: query
 *         name: nivel_riesgo
 *         schema:
 *           type: string
 *           enum: [bajo, medio, alto]
 *         description: Filtrar por nivel de riesgo
 *     responses:
 *       200:
 *         description: Dashboard obtenido exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos (solo operadores)
 */
router.get('/operador/dashboard', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), OperadorController.obtenerDashboard);

/**
 * @swagger
 * /api/operador/solicitudes/{solicitud_id}/revision:
 *   get:
 *     summary: Iniciar revisión de solicitud
 *     tags: [Operador]
 *     description: Abre el modal de revisión con documentos e información BCRA
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *     responses:
 *       200:
 *         description: Información de revisión obtenida
 *       404:
 *         description: Solicitud no encontrada
 */
router.get('/operador/solicitudes/:solicitud_id/revision', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), OperadorController.iniciarRevision);
/**
 * @swagger
 * /api/operador/solicitudes/{solicitud_id}/documentos/{documento_id}/validar-balance:
 *   put:
 *     summary: Validar balance contable
 *     tags: [Operador]
 *     description: Valida el documento de balance contable y recalcula scoring
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *       - in: path
 *         name: documento_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del documento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - validado
 *             properties:
 *               validado:
 *                 type: boolean
 *                 description: Si el documento es válido
 *               comentarios:
 *                 type: string
 *                 description: Comentarios de validación
 *               informacion_extraida:
 *                 type: object
 *                 description: Información extraída del balance
 *     responses:
 *       200:
 *         description: Documento validado exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.put('/operador/solicitudes/:solicitud_id/documentos/:documento_id/validar-balance', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), OperadorController.validarBalanceContable);

/**
 * @swagger
 * /api/operador/health:
 *   get:
 *     summary: Health check del endpoint de operador
 *     description: Verifica que el endpoint de operador esté funcionando correctamente
 *     tags:
 *       - Operador
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Endpoint funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Operador endpoint funcionando"
 *                 usuario:
 *                   type: string
 *                   format: uuid
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 */
router.get('/operador/health', AuthMiddleware.proteger, AuthMiddleware.autorizar('operador'), (req, res) => {
  res.json({
    success: true,
    message: 'Operador endpoint funcionando',
    usuario: req.usuario.id,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/notificaciones:
 * get:
 *   summary: Obtener notificaciones del usuario
 *   tags: [Notificaciones]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: query
 *       name: limit
 *       schema:
 *         type: integer
 *       description: Límite de notificaciones
 *     - in: query
 *       name: offset
 *       schema:
 *         type: integer
 *       description: Offset para paginación
 *     - in: query
 *       name: leida
 *       schema:
 *         type: boolean
 *       description: Filtrar por estado de lectura
 *   responses:
 *     200:
 *       description: Lista de notificaciones
 */
router.get('/notificaciones', AuthMiddleware.proteger, notificacionesController.obtenerNotificaciones);

/**
 * @swagger
 * /api/notificaciones/contador-no-leidas:
 * get:
 *   summary: Obtener contador de notificaciones no leídas
 *   tags: [Notificaciones]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200:
 *       description: Contador de notificaciones no leídas
 */
router.get('/notificaciones/contador-no-leidas', AuthMiddleware.proteger, notificacionesController.obtenerContadorNoLeidas);

/**
 * @swagger
 * /api/notificaciones/{id}/leer:
 * put:
 *   summary: Marcar notificación como leída
 *   tags: [Notificaciones]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *   responses:
 *     200:
 *       description: Notificación marcada como leída
 */
router.put('/notificaciones/:id/leer', AuthMiddleware.proteger, notificacionesController.marcarComoLeida);

/**
 * @swagger
 * /api/notificaciones/leer-todas:
 * put:
 *   summary: Marcar todas las notificaciones como leídas
 *   tags: [Notificaciones]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200:
 *       description: Todas las notificaciones marcadas como leídas
 */
router.put('/notificaciones/leer-todas', AuthMiddleware.proteger, notificacionesController.marcarTodasComoLeidas);

/**
 * @swagger
 * /api/comentarios:
 *   post:
 *     summary: Crear un nuevo comentario
 *     tags: [Comentarios]
 *     description: Crea un comentario en una solicitud. Genera notificación automática al destinatario.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComentarioInput'
 *           examples:
 *             operador_a_solicitante:
 *               summary: Comentario de operador a solicitante
 *               value:
 *                 solicitud_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 comentario: "Hemos revisado su documentación y necesitamos información adicional sobre el comprobante de domicilio reciente."
 *                 tipo: "operador_a_solicitante"
 *             solicitante_a_operador:
 *               summary: Comentario de solicitante a operador
 *               value:
 *                 solicitud_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 comentario: "He subido el documento solicitado. ¿Podrían revisarlo cuando tengan oportunidad?"
 *                 tipo: "solicitante_a_operador"
 *     responses:
 *       201:
 *         description: Comentario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Comentario'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No tiene permisos para comentar en esta solicitud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Solicitud no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/comentarios', AuthMiddleware.proteger, ComentariosController.crearComentario);

/**
 * @swagger
 * /api/solicitudes/{solicitud_id}/comentarios:
 *   get:
 *     summary: Obtener comentarios de una solicitud
 *     tags: [Comentarios]
 *     description: Obtiene todos los comentarios de una solicitud específica. Los comentarios se marcan automáticamente como leídos para el usuario actual.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [operador_a_solicitante, solicitante_a_operador, interno]
 *         description: Filtrar por tipo de comentario
 *         example: "operador_a_solicitante"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Límite de comentarios a retornar
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Offset para paginación
 *     responses:
 *       200:
 *         description: Lista de comentarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ComentariosResponse'
 *       403:
 *         description: No tiene permisos para ver los comentarios de esta solicitud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Solicitud no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/solicitudes/:solicitud_id/comentarios', AuthMiddleware.proteger, ComentariosController.obtenerComentariosSolicitud);

/**
 * @swagger
 * /api/comentarios/contador-no-leidos:
 *   get:
 *     summary: Obtener contador de comentarios no leídos
 *     tags: [Comentarios]
 *     description: Obtiene el número de comentarios no leídos para el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contador obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ContadorComentarios'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/comentarios/contador-no-leidos', AuthMiddleware.proteger, ComentariosController.obtenerContadorNoLeidos);

/**
 * @swagger
 * /api/comentarios/{id}:
 *   delete:
 *     summary: Eliminar comentario
 *     tags: [Comentarios]
 *     description: Elimina un comentario. Solo el autor del comentario o un operador pueden eliminarlo.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del comentario a eliminar
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Comentario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: No tiene permisos para eliminar este comentario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comentario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/comentarios/:id', AuthMiddleware.proteger, ComentariosController.eliminarComentario);
/**
 * @swagger
 * /api/firmas/iniciar-proceso/{solicitud_id}:
 *   post:
 *     summary: Iniciar proceso de firma digital
 *     description: Inicia el proceso de firma digital para un contrato de solicitud aprobada
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: solicitud_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la solicitud de crédito aprobada
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forzar_reinicio:
 *                 type: boolean
 *                 description: Forzar reinicio si existe proceso activo
 *                 example: false
 *     responses:
 *       '200':
 *         description: Proceso de firma iniciado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         firma:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             estado:
 *                               type: string
 *                               enum: [pendiente, enviado, firmado_solicitante, firmado_operador, firmado_completo, expirado]
 *                             fecha_expiracion:
 *                               type: string
 *                               format: date-time
 *                         fecha_expiracion:
 *                           type: string
 *                           format: date-time
 *                         url_firma:
 *                           type: string
 *                           description: Ruta para acceder a la firma desde el frontend
 *       '400':
 *         description: Ya existe proceso de firma activo
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Solicitud no encontrada o no aprobada
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.post('/firmas/iniciar-proceso/:solicitud_id', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),
    FirmaDigitalController.iniciarProcesoFirma
);


/**
 * @swagger
 * /api/firmas/info-firma-word/{firma_id}:
 *   get:
 *     summary: Obtener información para firma Word
 *     description: Obtiene la información completa necesaria para mostrar la interfaz de firma digital de Word
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del proceso de firma
 *     responses:
 *       '200':
 *         description: Información de firma obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         firma:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             estado:
 *                               type: string
 *                             fecha_expiracion:
 *                               type: string
 *                               format: date-time
 *                             solicitudes_credito:
 *                               type: object
 *                         documento:
 *                           type: string
 *                           format: byte
 *                           description: Documento Word en base64
 *                         nombre_documento:
 *                           type: string
 *                         tipo_documento:
 *                           type: string
 *                         fecha_expiracion:
 *                           type: string
 *                           format: date-time
 *                         solicitante:
 *                           $ref: '#/components/schemas/Usuario'
 *                         hash_original:
 *                           type: string
 *                         datos_contrato:
 *                           type: object
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Proceso de firma no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/info-firma-word/:firma_id', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),
    FirmaDigitalController.obtenerInfoFirma
);


/**
 * @swagger
 * /api/firmas/procesar-firma-word/{firma_id}:
 *   post:
 *     summary: Procesar firma Word
 *     description: Procesa y aplica la firma digital a un documento Word
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del proceso de firma
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firma_data
 *               - tipo_firma
 *             properties:
 *               firma_data:
 *                 type: object
 *                 required:
 *                   - firmaTexto
 *                   - firmaImagen
 *                 properties:
 *                   firmaTexto:
 *                     type: string
 *                     description: Texto de la firma
 *                   firmaImagen:
 *                     type: string
 *                     format: byte
 *                     description: Imagen de la firma en base64 (opcional)
 *                   ubicacion:
 *                     type: string
 *                     description: Ubicación del firmante
 *                   tipoFirma:
 *                     type: string
 *                     enum: [texto, imagen, mixta]
 *               tipo_firma:
 *                 type: string
 *                 enum: [solicitante, operador]
 *                 description: Tipo de firmante
 *               position_firma:
 *                 type: object
 *                 description: Posición de la firma en el documento
 *               documento_modificado:
 *                 type: string
 *                 format: byte
 *                 description: Documento modificado (opcional)
 *               firmas:
 *                 type: array
 *                 description: Múltiples firmas (para casos complejos)
 *     responses:
 *       '200':
 *         description: Firma procesada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         firma_id:
 *                           type: string
 *                           format: uuid
 *                         estado:
 *                           type: string
 *                         integridad_valida:
 *                           type: boolean
 *                         url_descarga:
 *                           type: string
 *                         hash_firmado:
 *                           type: string
 *       '400':
 *         description: Datos de firma incompletos o inválidos
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Proceso de firma no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.post('/firmas/procesar-firma-word/:firma_id', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),
    FirmaDigitalController.procesarFirma
);
/**
 * @swagger
 * /api/firmas/verificar-contrato/{firma_id}:
 *   get:
 *     summary: Verificar estado del contrato
 *     description: Verifica el estado y validez del contrato antes del proceso de firma
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Estado del contrato verificado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         firma_id:
 *                           type: string
 *                           format: uuid
 *                         estado_firma:
 *                           type: string
 *                         contrato_valido:
 *                           type: boolean
 *                         ruta_documento:
 *                           type: string
 *                         estado_contrato:
 *                           type: string
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '404':
 *         description: Proceso de firma no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/verificar-contrato/:firma_id', AuthMiddleware.proteger, ContratoController.verificarEstadoContrato);
/**
 * @swagger
 * /api/firmas/documento-para-firma/{firma_id}:
 *   get:
 *     summary: Obtener documento para firma
 *     description: Obtiene el documento Word en base64 listo para firma
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Documento obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         documento:
 *                           type: string
 *                           format: byte
 *                         tipo:
 *                           type: string
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Proceso de firma no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/documento-para-firma/:firma_id', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),

    FirmaDigitalController.obtenerDocumentoParaFirma
);


/**
 * @swagger
 * /api/firmas/descargar/{firma_id}:
 *   get:
 *     summary: Descargar documento firmado
 *     description: Descarga el documento Word ya firmado
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Documento descargado exitosamente
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Proceso de firma no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/descargar/:firma_id', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),

    FirmaDigitalController.descargarDocumentoFirmado
);
// Agregar esta ruta en el backend si no existe
router.get('/contratos/:contrato_id/descargar-firmado', 
  AuthMiddleware.proteger,
  async (req, res) => {
    try {
      const { contrato_id } = req.params;
      
      // Obtener información del contrato y firma
      const { data: contrato, error } = await supabase
        .from('contratos')
        .select(`
          *,
          firmas_digitales(
            url_documento_firmado,
            ruta_documento
          )
        `)
        .eq('id', contrato_id)
        .single();

      if (error || !contrato) {
        return res.status(404).json({
          success: false,
          message: 'Contrato no encontrado'
        });
      }

      const rutaDocumento = contrato.firmas_digitales?.[0]?.url_documento_firmado || 
                           contrato.firmas_digitales?.[0]?.ruta_documento;

      if (!rutaDocumento) {
        return res.status(404).json({
          success: false,
          message: 'Documento firmado no disponible'
        });
      }

      // Descargar archivo
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('kyc-documents')
        .download(rutaDocumento);

      if (downloadError) {
        throw downloadError;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="contrato-firmado-${contrato.numero_contrato}.docx"`);
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);

    } catch (error) {
      console.error('Error descargando contrato firmado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al descargar el contrato firmado'
      });
    }
  }
);
/**
 * @swagger
 * /api/firmas/estado/{firma_id}:
 *   get:
 *     summary: Verificar estado de firma
 *     description: Verifica el estado actual del proceso de firma digital
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Estado obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         estado:
 *                           type: string
 *                         integridad_valida:
 *                           type: boolean
 *                         fecha_firma_solicitante:
 *                           type: string
 *                           format: date-time
 *                         fecha_firma_operador:
 *                           type: string
 *                           format: date-time
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Proceso de firma no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/estado/:firma_id', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),

    FirmaDigitalController.verificarEstadoFirma
);

/**
 * @swagger
 * /api/firmas/contenido-contrato/{firma_id}:
 *   get:
 *     summary: Obtener contenido del contrato
 *     description: Obtiene información detallada del contenido del contrato
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Contenido del contrato obtenido
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         nombre:
 *                           type: string
 *                         tipo:
 *                           type: string
 *                         tamanio:
 *                           type: integer
 *                         informacion:
 *                           type: string
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '404':
 *         description: Proceso de firma no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/contenido-contrato/:firma_id', 
    AuthMiddleware.proteger,
    ContratoController.obtenerContenidoContrato
);

/**
 * @swagger
 * /api/firmas/pendientes:
 *   get:
 *     summary: Obtener firmas pendientes
 *     description: Obtiene la lista de firmas pendientes para el dashboard del usuario
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de firmas pendientes obtenida
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           estado:
 *                             type: string
 *                           fecha_envio:
 *                             type: string
 *                             format: date-time
 *                           fecha_expiracion:
 *                             type: string
 *                             format: date-time
 *                           contratos:
 *                             type: object
 *                           solicitudes_credito:
 *                             type: object
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/pendientes', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),

    FirmaDigitalController.obtenerFirmasPendientes
);
/**
 * @swagger
 * /api/firmas/{firma_id}/reenviar:
 *   post:
 *     summary: Reenviar solicitud de firma
 *     description: Reenvía una solicitud de firma expirada
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Solicitud reenviada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         firma_id:
 *                           type: string
 *                           format: uuid
 *                         nuevo_estado:
 *                           type: string
 *                         fecha_expiracion:
 *                           type: string
 *                           format: date-time
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Firma no encontrada o no expirada
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.post('/firmas/:firma_id/reenviar', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),
    FirmaDigitalController.reenviarSolicitudFirma
);

/**
 * @swagger
 * /api/firmas/{firma_id}/auditoria:
 *   get:
 *     summary: Obtener auditoría de firma
 *     description: Obtiene el historial completo de auditoría de un proceso de firma
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Auditoría obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           accion:
 *                             type: string
 *                           descripcion:
 *                             type: string
 *                           estado_anterior:
 *                             type: string
 *                           estado_nuevo:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           usuarios:
 *                             $ref: '#/components/schemas/Usuario'
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '403':
 *         $ref: '#/components/responses/Prohibido'
 *       '404':
 *         description: Proceso de firma no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/:firma_id/auditoria', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),

    FirmaDigitalController.obtenerAuditoriaFirma
);

/**
 * @swagger
 * /api/firmas/verificar-existente/{solicitud_id}:
 *   get:
 *     summary: Verificar firma existente
 *     description: Verifica si ya existe un proceso de firma activo para una solicitud
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: solicitud_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Verificación completada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         firma_existente:
 *                           type: object
 *                           nullable: true
 *                         existe:
 *                           type: boolean
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/verificar-existente/:solicitud_id', 
    AuthMiddleware.proteger,
    FirmaDigitalController.verificarFirmaExistente
);

/**
 * @swagger
 * /api/firmas/reiniciar-proceso/{solicitud_id}:
 *   post:
 *     summary: Reiniciar proceso de firma
 *     description: Reinicia completamente el proceso de firma para una solicitud
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: solicitud_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forzar_reinicio:
 *                 type: boolean
 *                 description: Forzar reinicio incluso si hay procesos activos
 *     responses:
 *       '200':
 *         description: Proceso reiniciado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         firma_anterior:
 *                           type: object
 *                           nullable: true
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.post('/firmas/reiniciar-proceso/:solicitud_id', 
    AuthMiddleware.proteger,
    FirmaDigitalController.reiniciarProcesoFirma
);

/**
 * @swagger
 * /api/firmas/renovar-expirada/{solicitud_id}:
 *   post:
 *     summary: Renovar firma expirada
 *     description: Renueva una firma digital que ha expirado
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: solicitud_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Firma renovada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         firma_id:
 *                           type: string
 *                           format: uuid
 *                         fecha_expiracion:
 *                           type: string
 *                           format: date-time
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '404':
 *         description: No se encontró firma expirada
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.post('/firmas/renovar-expirada/:solicitud_id', 
    AuthMiddleware.proteger,
    FirmaDigitalController.renovarFirmaExpirada
);

/**
 * @swagger
 * /api/firmas/{firma_id}/reparar-relacion:
 *   post:
 *     summary: Reparar relación firma-contrato
 *     description: Repara la relación entre una firma digital y su contrato asociado
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Relación reparada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         firma_id:
 *                           type: string
 *                           format: uuid
 *                         contrato_id:
 *                           type: string
 *                           format: uuid
 *                         contrato_ruta_documento:
 *                           type: string
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '404':
 *         description: Firma o contrato no encontrado
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.post('/firmas/:firma_id/reparar-relacion', 
    AuthMiddleware.proteger,
    FirmaDigitalController.repararRelacionFirmaContrato
);
/**
 * @swagger
 * /api/firmas/diagnostico-descarga/{firma_id}:
 *   get:
 *     summary: Diagnóstico de descarga de documento
 *     tags: [Firmas Digitales]
 *     security:
 *       - bearerAuth: []
 */
router.get('/firmas/diagnostico-descarga/:firma_id', 
    AuthMiddleware.proteger,
    async (req, res) => {
        try {
            const { firma_id } = req.params;
            
            console.log('. . DIAGNÓSTICO de descarga para:', firma_id);
            
            // Obtener información completa de la firma
            const { data: firma, error: firmaError } = await supabase
                .from('firmas_digitales')
                .select(`
                    *,
                    contratos(*),
                    solicitudes_credito(*)
                `)
                .eq('id', firma_id)
                .single();

            if (firmaError || !firma) {
                return res.json({
                    existe_firma: false,
                    error: firmaError?.message
                });
            }

            // Verificar archivos en storage
            const archivosRelevantes = [];
            
            if (firma.url_documento_firmado) {
                const { error: firmadoError } = await supabase.storage
                    .from('kyc-documents')
                    .download(firma.url_documento_firmado);
                archivosRelevantes.push({
                    tipo: 'firmado',
                    ruta: firma.url_documento_firmado,
                    existe: !firmadoError
                });
            }

            if (firma.contratos?.ruta_documento) {
                const { error: originalError } = await supabase.storage
                    .from('kyc-documents')
                    .download(firma.contratos.ruta_documento);
                archivosRelevantes.push({
                    tipo: 'original',
                    ruta: firma.contratos.ruta_documento,
                    existe: !originalError
                });
            }

            res.json({
                existe_firma: true,
                firma: {
                    id: firma.id,
                    estado: firma.estado,
                    url_documento_firmado: firma.url_documento_firmado,
                    contrato_id: firma.contrato_id,
                    solicitud_id: firma.solicitud_id
                },
                contrato: firma.contratos,
                archivos: archivosRelevantes,
                puede_descargar: ['firmado_completo', 'firmado_solicitante', 'firmado_operador', 'pendiente'].includes(firma.estado)
            });

        } catch (error) {
            console.error('. Error en diagnóstico:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * @swagger
 * /api/firmas/diagnostico/{firma_id}:
 *   get:
 *     summary: Diagnóstico de firma digital
 *     description: Realiza un diagnóstico completo del estado de un proceso de firma digital
 *     tags:
 *       - Firmas Digitales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Diagnóstico completado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 existe_firma:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 firma:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     estado:
 *                       type: string
 *                     contrato_id:
 *                       type: string
 *                       format: uuid
 *                     solicitud_id:
 *                       type: string
 *                       format: uuid
 *                 contrato:
 *                   type: object
 *                   nullable: true
 *                 solicitud:
 *                   type: object
 *                   nullable: true
 *                 tiene_documento:
 *                   type: boolean
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/firmas/diagnostico/:firma_id', 
    AuthMiddleware.proteger,
    async (req, res) => {
        try {
            const { firma_id } = req.params;
            
            console.log('. . DIAGNÓSTICO para firma_id:', firma_id);
            
            // 1. Verificar si existe en firmas_digitales
            const { data: firma, error: firmaError } = await supabase
                .from('firmas_digitales')
                .select('*')
                .eq('id', firma_id)
                .single();

            console.log('. Resultado firma_digitales:', { firma, error: firmaError });

            if (firmaError || !firma) {
                return res.json({
                    existe_firma: false,
                    error: firmaError?.message || 'No encontrado'
                });
            }

            // 2. Verificar contrato asociado
            const { data: contrato, error: contratoError } = await supabase
                .from('contratos')
                .select('*')
                .eq('id', firma.contrato_id)
                .single();

            console.log('. Resultado contratos:', { contrato, error: contratoError });

            // 3. Verificar solicitud
            const { data: solicitud, error: solicitudError } = await supabase
                .from('solicitudes_credito')
                .select('*')
                .eq('id', firma.solicitud_id)
                .single();

            console.log('. Resultado solicitudes_credito:', { solicitud, error: solicitudError });

            res.json({
                existe_firma: true,
                firma: {
                    id: firma.id,
                    estado: firma.estado,
                    contrato_id: firma.contrato_id,
                    solicitud_id: firma.solicitud_id
                },
                contrato: contrato || { error: contratoError?.message },
                solicitud: solicitud || { error: solicitudError?.message },
                tiene_documento: !!contrato?.ruta_documento
            });

        } catch (error) {
            console.error('. Error en diagnóstico:', error);
            res.status(500).json({ error: error.message });
        }
    }
);
/**
 * @swagger
 * /api/firmas/ver-contrato-firmado/{firma_id}:
 *   get:
 *     summary: Ver contrato firmado en el navegador
 *     tags: [Firmas Digitales]
 *     description: Muestra el contrato firmado directamente en el navegador
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: firma_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contrato firmado mostrado exitosamente
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Contrato no encontrado
 */
const mammoth = require('mammoth');

router.get('/firmas/ver-contrato-firmado/:firma_id', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),
    async (req, res) => {
        try {
            const { firma_id } = req.params;
            
            console.log('🔍 Solicitando visualización de contrato firmado:', firma_id);

            // Obtener información de la firma
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select(`
                    id,
                    estado,
                    url_documento_firmado,
                    ruta_documento,
                    contratos(
                        id,
                        numero_contrato,
                        ruta_documento
                    )
                `)
                .eq('id', firma_id)
                .single();

            if (error || !firma) {
                console.error('. Firma no encontrada:', error);
                return res.status(404).json({
                    success: false,
                    message: 'Proceso de firma no encontrado'
                });
            }

            // Determinar qué documento mostrar (preferir el firmado)
            let rutaDocumento = firma.url_documento_firmado || 
                               firma.ruta_documento || 
                               firma.contratos?.ruta_documento;

            if (!rutaDocumento) {
                console.error('. No hay ruta de documento disponible');
                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado'
                });
            }

            console.log('. Mostrando documento desde:', rutaDocumento);

            // Descargar archivo
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('kyc-documents')
                .download(rutaDocumento);

            if (downloadError) {
                console.error('. Error descargando archivo:', downloadError);
                throw new Error('Error accediendo al documento: ' + downloadError.message);
            }

            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Verificar si es un archivo Word
            const esWord = rutaDocumento.toLowerCase().endsWith('.docx');
            
            if (esWord) {
                console.log('. Convirtiendo Word a HTML para visualización...');
                
                try {
                    // Convertir Word a HTML usando mammoth
                    const result = await mammoth.convertToHtml({ buffer: buffer });
                    const html = result.value;
                    
                    // Crear un HTML completo con estilos
                    const htmlCompleto = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato Firmado - ${firma.contratos?.numero_contrato || firma_id}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
            background-color: #f5f5f5;
        }
        .documento-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1976d2;
            margin: 0;
        }
        .metadata {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .contenido-documento {
            line-height: 1.8;
        }
        .contenido-documento p {
            margin-bottom: 16px;
        }
        .contenido-documento table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .contenido-documento table, 
        .contenido-documento th, 
        .contenido-documento td {
            border: 1px solid #ddd;
        }
        .contenido-documento th, 
        .contenido-documento td {
            padding: 12px;
            text-align: left;
        }
        .contenido-documento th {
            background-color: #f8f9fa;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="documento-container">
        <div class="header">
            <h1>. CONTRATO FIRMADO</h1>
            <p><strong>Número de Contrato:</strong> ${firma.contratos?.numero_contrato || 'No disponible'}</p>
            <p><strong>Estado:</strong> ${firma.estado || 'No disponible'}</p>
        </div>
        
        <div class="metadata">
            <p><strong>ID de Firma:</strong> ${firma_id}</p>
            <p><strong>Fecha de visualización:</strong> ${new Date().toLocaleString('es-ES')}</p>
            <p><strong>Documento:</strong> ${rutaDocumento.split('/').pop()}</p>
        </div>
        
        <div class="contenido-documento">
            ${html}
        </div>
        
        <div class="footer">
            <p>Documento generado el ${new Date().toLocaleString('es-ES')} | Sistema de Gestión de Contratos</p>
        </div>
    </div>
</body>
</html>`;

                    // Enviar como HTML
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.send(htmlCompleto);
                    
                } catch (conversionError) {
                    console.error('. Error convirtiendo Word a HTML:', conversionError);
                    
                    // Fallback: ofrecer descarga del documento original
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                    res.setHeader('Content-Disposition', `attachment; filename="contrato-${firma.contratos?.numero_contrato || firma_id}.docx"`);
                    res.setHeader('Content-Length', buffer.length);
                    res.send(buffer);
                }
                
            } else {
                // Si ya es PDF, enviar directamente
                console.log('📊 Enviando PDF directamente');
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="contrato-${firma.contratos?.numero_contrato || firma_id}.pdf"`);
                res.setHeader('Content-Length', buffer.length);
                res.send(buffer);
            }

        } catch (error) {
            console.error('. Error mostrando contrato firmado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al mostrar el contrato: ' + error.message
            });
        }
    }
);
// ==================== RUTAS DE PLANTILLAS ====================

/**
 * @swagger
 * /api/plantillas:
 *   get:
 *     summary: Listar plantillas de documentos
 *     description: Obtiene la lista de todas las plantillas de documentos disponibles
 *     tags:
 *       - Plantillas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de plantillas obtenida
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           tipo:
 *                             type: string
 *                           nombre_archivo:
 *                             type: string
 *                           ruta_storage:
 *                             type: string
 *                           tamanio_bytes:
 *                             type: integer
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/plantillas', PlantillasDocumentoController.listarPlantillas);

/**
 * @swagger
 * /api/plantillas:
 *   post:
 *     summary: Subir nueva plantilla
 *     description: Sube una nueva plantilla de documento al sistema
 *     tags:
 *       - Plantillas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Archivo Word de la plantilla
 *               tipo:
 *                 type: string
 *                 description: Tipo de plantilla
 *     responses:
 *       '200':
 *         description: Plantilla subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       '400':
 *         description: No se envió archivo
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.post('/plantillas', upload.single('archivo'), PlantillasDocumentoController.subirPlantilla);

/**
 * @swagger
 * /api/plantillas/{id}:
 *   put:
 *     summary: Actualizar plantilla existente
 *     description: Actualiza una plantilla de documento existente
 *     tags:
 *       - Plantillas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la plantilla
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Nuevo archivo Word de la plantilla
 *     responses:
 *       '200':
 *         description: Plantilla actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '404':
 *         description: Plantilla no encontrada
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.put('/plantillas/:id', upload.single('archivo'), PlantillasDocumentoController.actualizarPlantilla);

/**
 * @swagger
 * /api/plantillas/{id}/descargar:
 *   get:
 *     summary: Descargar plantilla específica
 *     description: Descarga una plantilla de documento específica
 *     tags:
 *       - Plantillas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Plantilla descargada exitosamente
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '404':
 *         description: Plantilla no encontrada
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/plantillas/:id/descargar', PlantillasDocumentoController.descargarPlantilla);
/**
 * @swagger
 * tags:
 *   - name: Chatbot
 *     description: Endpoints para el chatbot de asistencia
 */

/**
 * @swagger
 * /api/chatbot/mensaje:
 *   post:
 *     summary: Enviar mensaje al chatbot (público)
 *     tags: [Chatbot]
 *     description: Procesa un mensaje del usuario y devuelve respuesta del chatbot. No requiere autenticación.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mensaje
 *             properties:
 *               mensaje:
 *                 type: string
 *                 description: Mensaje del usuario para el chatbot
 *                 example: "¿Qué documentos necesito para solicitar un crédito?"
 *     responses:
 *       200:
 *         description: Respuesta del chatbot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     respuesta:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     usuario:
 *                       type: object
 *                       nullable: true
 */
router.post('/chatbot/mensaje', ChatbotController.procesarMensaje);

/**
 * @swagger
 * /api/chatbot/mensaje-autenticado:
 *   post:
 *     summary: Procesar mensaje del chatbot (autenticado)
 *     description: Procesa un mensaje del chatbot para usuarios autenticados
 *     tags:
 *       - Chatbot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mensaje
 *             properties:
 *               mensaje:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Mensaje del usuario al chatbot
 *     responses:
 *       '200':
 *         description: Mensaje procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         respuesta:
 *                           type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         usuario:
 *                           type: object
 *                           nullable: true
 *       '400':
 *         description: Mensaje vacío o demasiado largo
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.post('/chatbot/mensaje-autenticado', 
    AuthMiddleware.proteger, 
    ChatbotController.procesarMensaje
);

/**
 * @swagger
 * /api/chatbot/historial:
 *   get:
 *     summary: Obtener historial del chatbot
 *     description: Obtiene el historial de conversaciones del chatbot para el usuario autenticado
 *     tags:
 *       - Chatbot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Límite de registros a obtener
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginación
 *     responses:
 *       '200':
 *         description: Historial obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           usuario_id:
 *                             type: string
 *                             format: uuid
 *                           pregunta:
 *                             type: string
 *                           respuesta:
 *                             type: string
 *                           sentimiento:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       '401':
 *         $ref: '#/components/responses/NoAutorizado'
 *       '500':
 *         $ref: '#/components/responses/ErrorServidor'
 */
router.get('/chatbot/historial',
    AuthMiddleware.proteger,
    ChatbotController.obtenerHistorial
);

/**
 * @swagger
 * /api/chatbot/health:
 *   get:
 *     summary: Health check del chatbot
 *     description: Verifica que el servicio de chatbot esté funcionando correctamente
 *     tags:
 *       - Chatbot
 *     responses:
 *       '200':
 *         description: Chatbot funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Chatbot funcionando correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     servicio:
 *                       type: string
 *                       example: "Gemini API"
 *                     estado:
 *                       type: string
 *                       example: "activo"
 *                     prueba:
 *                       type: string
 *                       example: "exitosa"
 *       '503':
 *         description: Chatbot temporalmente no disponible
 */
router.get('/chatbot/health', ChatbotController.healthCheck);

// ==================== RUTAS DE CONTACTOS BANCARIOS ====================


/**
 * @swagger
 * /api/contactos-bancarios/buscar:
 *   get:
 *     summary: Buscar contactos por numero de cuenta
 *     tags: [Contactos Bancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: numero de cuenta
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contactos encontrados exitosamente
 */
router.get('/contactos-bancarios/buscar', 
  AuthMiddleware.proteger, 
  ContactosBancariosController.buscarContactosPorNumeroCuenta
);

router.get('/contactos-bancarios', 
  AuthMiddleware.proteger, 
  ContactosBancariosController.obtenerTodosContactos
);
router.get('/contactos-bancarios/mis-contactos', 
  AuthMiddleware.proteger, 
  ContactosBancariosController.obtenerContactosOperador
);
/**
 * @swagger
 * /api/contactos-bancarios/{id}:
 *   put:
 *     summary: Editar contacto bancario existente
 *     tags: [Contactos Bancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero_cuenta:
 *                 type: string
 *               tipo_cuenta:
 *                 type: string
 *                 enum: [ahorros, corriente]
 *               moneda:
 *                 type: string
 *                 enum: [USD, ARS]
 *               nombre_banco:
 *                 type: string
 *               email_contacto:
 *                 type: string
 *                 format: email
 *               telefono_contacto:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contacto actualizado exitosamente
 */
router.put('/contactos-bancarios/:id', 
  AuthMiddleware.proteger, 
  AuthMiddleware.autorizar('operador'),
  ContactosBancariosController.editarContacto
);

/**
 * @swagger
 * /api/contactos-bancarios/{id}:
 *   delete:
 *     summary: Eliminar contacto bancario
 *     tags: [Contactos Bancarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Contacto eliminado exitosamente
 */
router.delete('/contactos-bancarios/:id', 
  AuthMiddleware.proteger, 
  AuthMiddleware.autorizar('operador'),
  ContactosBancariosController.eliminarContacto
);


/**
 * @swagger
 * /api/contactos-bancarios:
 *   post:
 *     summary: Crear nuevo contacto bancario
 *     tags: [Contactos Bancarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - solicitante_id
 *               - numero_cuenta
 *             properties:
 *               solicitante_id:
 *                 type: string
 *                 format: uuid
 *               numero_cuenta:
 *                 type: string
 *               tipo_cuenta:
 *                 type: string
 *                 enum: [ahorros, corriente]
 *               moneda:
 *                 type: string
 *                 enum: [USD, ARS]
 *               nombre_banco:
 *                 type: string
 *               email_contacto:
 *                 type: string
 *                 format: email
 *               telefono_contacto:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contacto creado exitosamente
 */
router.post('/contactos-bancarios', 
  AuthMiddleware.proteger, 
  ContactosBancariosController.crearContacto
);
router.get('/transferencias/habilitacion/:solicitud_id', 
  AuthMiddleware.proteger, 
  TransferenciasBancariasController.verificarHabilitacionTransferencia
);

router.post('/transferencias', 
  AuthMiddleware.proteger, 
  AuthMiddleware.autorizar('operador'), 
  TransferenciasBancariasController.crearTransferencia
);

router.get('/transferencias/comprobante/:transferencia_id', 
  AuthMiddleware.proteger, 
  TransferenciasBancariasController.obtenerComprobante
);

router.get('/transferencias/historial', 
  AuthMiddleware.proteger, 
  TransferenciasBancariasController.obtenerHistorial
);
/**
 * @swagger
 * /api/transferencias/forzar-actualizacion/{solicitud_id}:
 *   post:
 *     summary: Forzar actualización de estado de firma
 *     tags: [Transferencias]
 *     description: Fuerza la actualización del estado de firma y verifica habilitación de transferencia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Actualización forzada exitosamente
 */
router.post('/transferencias/forzar-actualizacion/:solicitud_id', 
    AuthMiddleware.proteger, 
    AuthMiddleware.autorizar('operador'), 
    TransferenciasBancariasController.forzarActualizacionEstado
);

/**
 * @swagger
 * /api/transferencias/verificar-firma/{solicitud_id}:
 *   get:
 *     summary: Verificar estado de firma específico
 *     tags: [Transferencias]
 *     description: Verifica el estado específico de la firma digital para una solicitud
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: solicitud_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Estado de firma obtenido
 */
router.get('/transferencias/verificar-firma/:solicitud_id', 
    AuthMiddleware.proteger, 
    AuthMiddleware.autorizar('operador'), 
    async (req, res) => {
        try {
            const { solicitud_id } = req.params;
            
            const { data: firma } = await supabase
                .from('firmas_digitales')
                .select('*')
                .eq('solicitud_id', solicitud_id)
                .single();

            res.json({
                success: true,
                data: {
                    firma: firma,
                    puede_transferir: firma?.estado === 'firmado_completo' || firma?.integridad_valida === true
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error verificando firma'
            });
        }
    }
);
// Agregar estas rutas a tu archivo de rutas
router.get('/solicitudes/:solicitud_id/contrato/documentos', AuthMiddleware.proteger, DocumentoController.obtenerDocumentosContrato);
router.get('/solicitudes/:solicitud_id/comprobantes', AuthMiddleware.proteger, DocumentoController.obtenerComprobantesTransferencia);
router.get('/contratos/:contrato_id/descargar', AuthMiddleware.proteger, DocumentoController.descargarContrato);
router.get('/transferencias/:transferencia_id/comprobante/descargar', AuthMiddleware.proteger, DocumentoController.descargarComprobante);
router.get('/documentos/:tipo/:id/ver', AuthMiddleware.proteger, DocumentoController.verDocumento);

/**
 * @swagger
 * /api/operador/todos-los-documentos:
 *   get:
 *     summary: Obtener todos los documentos del sistema (Operadores)
 *     tags: [Operador]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los documentos
 */
router.get('/operador/todos-los-documentos', 
  AuthMiddleware.proteger,
  AuthMiddleware.autorizar('operador'),
  DocumentoController.obtenerTodosLosDocumentos // Asegúrate de que este método existe
);
// Nueva ruta para listar documentos del storage
router.get('/solicitudes/:solicitud_id/documentos-storage', 
    AuthMiddleware.proteger, 
    DocumentoController.listarDocumentosStorage
);

// Ruta . para documentos de contrato
router.get('/solicitudes/:solicitud_id/contrato/documentos-completos', 
    AuthMiddleware.proteger, 
    DocumentoController.obtenerDocumentosContrato
);
/**
 * @swagger
 * /api/firmas/descargar-contrato-firmado/{firma_id}:
 *   get:
 *     summary: Descargar contrato firmado específico
 *     tags: [Firmas Digitales]
 *     description: Descarga específicamente el contrato firmado, no el original
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: firma_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contrato firmado descargado exitosamente
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Contrato firmado no encontrado
 */
router.get('/firmas/descargar-contrato-firmado/:firma_id', 
    AuthMiddleware.proteger,
    AuthMiddleware.autorizar('operador', 'solicitante'),
    FirmaDigitalController.descargarContratoFirmadoEspecifico
);

/**
 * @swagger
 * /api/{firma_id}/documento-actual:
 *   get:
 *     summary: Obtener documento actual para firma
 *     tags: [Firmas Digitales]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:firma_id/documento-actual', FirmaDigitalController.obtenerDocumentoActual);

/**
 * @swagger
 * /api/{firma_id}/verificar-integridad:
 *   get:
 *     summary: Verificar integridad de documento firmado
 *     tags: [Firmas Digitales]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:firma_id/verificar-integridad', async (req, res) => {
    try {
        const { firma_id } = req.params;
        
        const integridadValida = await WordService.verificarIntegridadCompleta(firma_id);
        const esIntegridadValida = Boolean(integridadValida);

        res.json({
            success: true,
            data: {
                firma_id: firma_id,
                integridad_valida: esIntegridadValida,
                mensaje: esIntegridadValida
            }
        });
    } catch (error) {
        console.error('Error verificando integridad:', error);
        res.status(500).json({
            success: false,
            message: 'Error verificando integridad'
        });
    }
});

module.exports = router;