// backend/interfaces/routes/reactivacion.routes.js
const express = require('express');
const router = express.Router();

module.exports = (reactivacionController) => {
  /**
   * @swagger
   * tags:
   *   - name: Reactivación
   *     description: Endpoints para reactivación de cuentas
   */

  /**
   * @swagger
   * /api/reactivacion/solicitar:
   *   post:
   *     summary: Solicitar reactivación de cuenta inactiva
   *     tags: [Reactivación]
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
  router.post('/solicitar', (req, res) => reactivacionController.solicitarReactivacionCuenta(req, res));

  /**
   * @swagger
   * /api/reactivacion/reactivar:
   *   post:
   *     summary: Reactivar cuenta con email y password
   *     tags: [Reactivación]
   *     description: Reactiva una cuenta inactiva usando email y contraseña
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Cuenta reactivada exitosamente
   *       401:
   *         description: Credenciales inválidas
   *       404:
   *         description: Cuenta no encontrada
   */
  router.post('/reactivar', (req, res) => reactivacionController.reactivarCuenta(req, res));

  /**
   * @swagger
   * /api/reactivacion/procesar:
   *   get:
   *     summary: Procesar token de recuperación
   *     tags: [Reactivación]
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
   *       400:
   *         description: Token inválido o expirado
   */
  router.get('/procesar', (req, res) => reactivacionController.procesarRecuperacionCuenta(req, res));

  return router;
};