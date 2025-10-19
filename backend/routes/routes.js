const express = require("express");
const AuthMiddleware = require("../middleware/auth");
const authController = require("../controladores/authController");
const usuariosController = require("../controladores/UsuarioController");
const confirmacionController = require("../controladores/confirmacionController");
const notificacionesController = require("../controladores/NotificacionesController");
const SolicitudesController = require('../controladores/SolicitudesController');
const OperadorController = require('../controladores/OperadorController');
const DocumentoController = require('../controladores/DocumentoController');
const reactivacionController = require('../controladores/reactivacionController'); // Cambiado
const webhooksController = require('../controladores/webhooksController'); // Cambiado
const EmailValidationMiddleware = require("../middleware/emailValidation");

// Middleware existentes
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, JPG, JPEG, PNG.'), false);
    }
  }
});
// ==================== COMPONENTS SCHEMAS ====================

/**
 * @swagger
 * components:
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
 * 
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
router.post("/usuarios/verificar-email",  EmailValidationMiddleware.verifyEmailOnly, (req, res) => {
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
  EmailValidationMiddleware.validateEmailBeforeAuth,
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
 *     summary: Cerrar sesión
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
 *                 description: Archivo a subir (PDF, JPG, JPEG, PNG, máximo 5MB)
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
router.get('/documentos/:documento_id/descargar', AuthMiddleware.proteger, DocumentoController.descargarDocumento);

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
module.exports = router;