// backend/interfaces/routes/auth.routes.js 
const express = require('express');
const router = express.Router();

module.exports = (authController, confirmacionController, reactivacionController) => {
  // ==================== RUTAS DE CONFIRMACIÓN Y AUTENTICACION ====================
  
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
 router.get("/confirmar", (req, res) => {
    // Verificar que el controlador existe
    if (!confirmacionController || typeof confirmacionController.confirmarEmail !== 'function') {
      console.error('. Error: confirmacionController no tiene método confirmarEmail');
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
    return confirmacionController.confirmarEmail(req, res);
  });

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
router.post("/reenviar-confirmacion", (req, res) => confirmacionController.reenviarConfirmacion(req, res));


  // ==================== RUTAS PÚBLICAS ====================

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
router.get("/restablecer-cuenta", (req, res) => reactivacionController.procesarRecuperacionCuenta(req, res));

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
router.post("/refresh", (req, res) => authController.refreshToken(req, res));

  return router;
};