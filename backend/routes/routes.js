const express = require("express");
const { proteger, autorizar } = require("../middleware/auth");
const authController = require("../controladores/authController");
const usuariosController = require("../controladores/usuariosController");
const confirmacionController = require("../controladores/confirmacionController");
const {
  validateEmailBeforeAuth,
  verifyEmailOnly,
} = require("../middleware/emailValidation");
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *         nombre_completo:
 *           type: string
 *           description: Nombre completo del usuario
 *         documento_identidad:
 *           type: string
 *           description: Documento de identidad
 *         telefono:
 *           type: string
 *           description: Número de teléfono
 *         rol:
 *           type: string
 *           enum: [solicitante, operador]
 *           description: Rol del usuario en el sistema
 *         email_confirmado:
 *           type: boolean
 *           description: Estado de confirmación del email
 *         activo:
 *           type: boolean
 *           description: Estado activo del usuario
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del usuario
 *       example:
 *         id: 1
 *         email: "usuario@ejemplo.com"
 *         nombre_completo: "Juan Pérez"
 *         documento_identidad: "12345678"
 *         telefono: "+573001234567"
 *         rol: "solicitante"
 *         email_confirmado: true
 *         activo: true
 *         fecha_creacion: "2024-01-01T00:00:00Z"
 *
 *     UsuarioRegistro:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - nombre_completo
 *         - documento_identidad
 *         - telefono
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *         password:
 *           type: string
 *           minLength: 6
 *           description: Contraseña del usuario
 *         nombre_completo:
 *           type: string
 *           description: Nombre completo del usuario
 *         documento_identidad:
 *           type: string
 *           description: Documento de identidad
 *         telefono:
 *           type: string
 *           description: Número de teléfono
 *         rol:
 *           type: string
 *           enum: [solicitante, operador]
 *           default: solicitante
 *           description: Rol del usuario
 *       example:
 *         email: "nuevo@ejemplo.com"
 *         password: "password123"
 *         nombre_completo: "María García"
 *         documento_identidad: "87654321"
 *         telefono: "+573009876543"
 *         rol: "solicitante"
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
 *           description: Email del usuario
 *         password:
 *           type: string
 *           description: Contraseña del usuario
 *       example:
 *         email: "usuario@ejemplo.com"
 *         password: "password123"
 *
 *     Response:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica si la operación fue exitosa
 *         message:
 *           type: string
 *           description: Mensaje descriptivo del resultado
 *         data:
 *           type: object
 *           description: Datos de respuesta (opcional)
 *         token:
 *           type: string
 *           description: Token JWT (solo en login exitoso)
 *       example:
 *         success: true
 *         message: "Operación exitosa"
 *         data: {}
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Mensaje de error
 *         error:
 *           type: string
 *           description: Detalles técnicos del error (opcional)
 *       example:
 *         success: false
 *         message: "Error en la operación"
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
 *               $ref: '#/components/schemas/Response'
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
 *               $ref: '#/components/schemas/Response'
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
 *                 - $ref: '#/components/schemas/Response'
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
router.post("/usuarios/verificar-email", verifyEmailOnly, (req, res) => {
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
 *     description: Registra un nuevo usuario en el sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioRegistro'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Response'
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
  validateEmailBeforeAuth,
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
 *                 - $ref: '#/components/schemas/Response'
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
 *               $ref: '#/components/schemas/Response'
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
 *                 - $ref: '#/components/schemas/Response'
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
 * /api/usuario/cambiar-contrasena:
 *   put:
 *     summary: Cambiar contraseña de usuario
 *     tags: [Usuarios]
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
 *               - contrasenaActual
 *               - nuevaContrasena
 *             properties:
 *               contrasenaActual:
 *                 type: string
 *                 description: Contraseña actual del usuario
 *               nuevaContrasena:
 *                 type: string
 *                 description: Nueva contraseña a establecer
 *             example:
 *               contrasenaActual: "123456"
 *               nuevaContrasena: "NuevaPass@2025"
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 *       400:
 *         description: Datos inválidos o contraseña actual incorrecta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/usuario/cambiar-contrasena', proteger, usuariosController.cambiarContrasena);

// ==================== RUTAS PÚBLICAS ====================

/**
 * @swagger
 * /api/usuarios/recuperar-contrasena:
 *   post:
 *     summary: Recuperar contraseña
 *     tags: [Usuarios]
 *     description: Permite restablecer la contraseña de un usuario mediante un token de recuperación enviado por correo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - nuevaContrasena
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de recuperación recibido por email
 *               nuevaContrasena:
 *                 type: string
 *                 description: Nueva contraseña que se desea establecer
 *             example:
 *               token: "abcd1234token"
 *               nuevaContrasena: "NuevaPass@2025"
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/usuarios/recuperar-contrasena', usuariosController.recuperarContrasena);

/**
 * @swagger
 * /api/usuarios/solicitar-recuperacion:
 *   post:
 *     summary: Solicitar enlace de recuperación
 *     tags: [Usuarios]
 *     description: Envía un correo con un enlace o token para recuperar la contraseña.
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
 *                 description: Email del usuario registrado
 *             example:
 *               email: "usuario@ejemplo.com"
 *     responses:
 *       200:
 *         description: Enlace de recuperación enviado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 *       400:
 *         description: Email no registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/usuarios/solicitar-recuperacion', usuariosController.solicitarRecuperacionContrasena);
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
 *                 - $ref: '#/components/schemas/Response'
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
  proteger,
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
 *                 - $ref: '#/components/schemas/Response'
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
router.get("/usuario/perfil", proteger, usuariosController.obtenerPerfil);

/**
 * @swagger
 * /api/usuario/perfil:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Usuario]
 *     description: Actualiza los datos del perfil del usuario autenticado
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
 *               documento_identidad:
 *                 type: string
 *                 description: Documento de identidad
 *             example:
 *               nombre_completo: "Juan Pérez Actualizado"
 *               telefono: "+573001234567"
 *               documento_identidad: "12345678"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Response'
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
 */
router.put("/usuario/perfil", proteger, usuariosController.actualizarPerfil);

/**
 * @swagger
 * /api/usuario/desactivar-cuenta:
 *   put:
 *     summary: Desactivar cuenta del usuario autenticado
 *     tags: [Usuario]
 *     description: Desactiva la cuenta del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta desactivada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Response'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/usuario/desactivar-cuenta",
  proteger,
  usuariosController.desactivarCuenta
);

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
 *                 - $ref: '#/components/schemas/Response'
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
  proteger,
  autorizar("operador"),
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
 *               documento_identidad:
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
 *               documento_identidad: "12345678"
 *               rol: "solicitante"
 *               activo: true
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Response'
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
  proteger,
  autorizar("operador"),
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
 *                 - $ref: '#/components/schemas/Response'
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
router.get("/admin/dashboard", proteger, autorizar("operador"), (req, res) => {
  res.json({
    success: true,
    message: "Dashboard administrativo",
    data: {
      usuario: req.usuario.nombre_completo,
      rol: req.usuario.rol,
    },
  });
});

module.exports = router;
