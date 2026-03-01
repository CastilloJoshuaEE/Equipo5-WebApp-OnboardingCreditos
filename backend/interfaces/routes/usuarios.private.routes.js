// backend/interfaces/routes/usuarios.private.routes.js
const express = require('express');
const router = express.Router();
/**
 * @param {import('../controllers/UsuarioController')} usuarioController
 * @param {typeof import('../middleware/auth.middleware')} authMiddleware
 */
module.exports = (usuarioController, authMiddleware) => {
// ==================== RUTAS DE USUARIO AUTENTICADO ====================
/**
 * @swagger
 * /api/usuarioautenticado/cambiar-contrasena:
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
router.put('/cambiar-contrasena', authMiddleware.proteger, (req, res) => usuarioController.cambiarContrasena(req, res));
/**
 * @swagger
 * /api/usuarioautenticado/estado-confirmacion:
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

 router.get('/estado-confirmacion', authMiddleware.proteger, (req, res) => usuarioController.estadoConfirmacionEmail(req, res));
/**
 * @swagger
 * /api/usuarioautenticado/perfil:
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
router.get('/perfil', authMiddleware.proteger, (req, res) => usuarioController.obtenerPerfilPropio(req, res));
/**
 * @swagger
 * /api/usuarioautenticado/editar-perfil:
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
router.put("/editar-perfil", authMiddleware.proteger, (req, res) => usuarioController.actualizarPerfilPropio(req, res));
/**
 * @swagger
 * /api/usuarioautenticado/desactivar-cuenta:
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

router.put('/desactivar-cuenta', authMiddleware.proteger, (req, res) => usuarioController.desactivarCuenta(req, res));
/**
 * @swagger
 * /api/usuarioautenticado/configuracion-cuenta:
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
router.get('/configuracion-cuenta', authMiddleware.proteger, (req, res) => usuarioController.obtenerConfiguracionCuenta(req, res));
/**
 * @swagger
 * /api/usuarioautenticado/email-recuperacion:
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
router.put('/email-recuperacion', authMiddleware.proteger, (req, res) => usuarioController.actualizarEmailRecuperacion(req, res));
/**
 * @swagger
 * /api/usuarioautenticado/estado-cuenta:
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
router.get('/estado-cuenta', authMiddleware.proteger, (req, res) => usuarioController.verificarEstadoCuenta(req, res));


  return router;
};