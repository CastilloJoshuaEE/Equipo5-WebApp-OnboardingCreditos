// backend/interfaces/routes/verificaciones-kyc.routes.js
const express = require('express');
const router = express.Router();

module.exports = (verificacionKYCController, authMiddleware) => {
  /**
   * @swagger
   * tags:
   *   - name: Verificaciones KYC
   *     description: Endpoints para gestión de verificaciones KYC
   */

  /**
   * @swagger
   * /api/verificaciones-kyc:
   *   post:
   *     summary: Crear nueva verificación KYC
   *     tags: [Verificaciones KYC]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - solicitud_id
   *               - session_id
   *               - proveedor
   *             properties:
   *               solicitud_id:
   *                 type: string
   *                 format: uuid
   *               session_id:
   *                 type: string
   *               proveedor:
   *                 type: string
   *                 enum: [didit]
   *     responses:
   *       201:
   *         description: Verificación creada exitosamente
   */
  router.post('/',
    authMiddleware.proteger,
    (req, res) => verificacionKYCController.crear(req, res)
  );

  /**
   * @swagger
   * /api/verificaciones-kyc/{id}:
   *   get:
   *     summary: Obtener verificación por ID
   *     tags: [Verificaciones KYC]
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
   *         description: Verificación obtenida exitosamente
   */
  router.get('/:id',
    authMiddleware.proteger,
    (req, res) => verificacionKYCController.obtenerPorId(req, res)
  );

  /**
   * @swagger
   * /api/verificaciones-kyc/solicitud/{solicitud_id}:
   *   get:
   *     summary: Obtener verificaciones por solicitud
   *     tags: [Verificaciones KYC]
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
   *         description: Verificaciones obtenidas exitosamente
   */
  router.get('/solicitud/:solicitud_id',
    authMiddleware.proteger,
    (req, res) => verificacionKYCController.obtenerPorSolicitud(req, res)
  );

  /**
   * @swagger
   * /api/verificaciones-kyc/session/{session_id}:
   *   get:
   *     summary: Obtener verificación por session_id
   *     tags: [Verificaciones KYC]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: session_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Verificación obtenida exitosamente
   */
  router.get('/session/:session_id',
    authMiddleware.proteger,
    (req, res) => verificacionKYCController.obtenerPorSessionId(req, res)
  );

  /**
   * @swagger
   * /api/verificaciones-kyc/{id}:
   *   put:
   *     summary: Actualizar verificación por ID
   *     tags: [Verificaciones KYC]
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
   *               estado:
   *                 type: string
   *                 enum: [pendiente, aprobado, rechazado, en_proceso]
   *               datos_verificacion:
   *                 type: object
   *     responses:
   *       200:
   *         description: Verificación actualizada exitosamente
   */
  router.put('/:id',
    authMiddleware.proteger,
    (req, res) => verificacionKYCController.actualizar(req, res)
  );

  /**
   * @swagger
   * /api/verificaciones-kyc/session/{session_id}:
   *   put:
   *     summary: Actualizar verificación por session_id
   *     tags: [Verificaciones KYC]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: session_id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               estado:
   *                 type: string
   *                 enum: [pendiente, aprobado, rechazado, en_proceso]
   *               datos_verificacion:
   *                 type: object
   *     responses:
   *       200:
   *         description: Verificación actualizada exitosamente
   */
  router.put('/session/:session_id',
    authMiddleware.proteger,
    (req, res) => verificacionKYCController.actualizarPorSessionId(req, res)
  );

  /**
   * @swagger
   * /api/verificaciones-kyc/estadisticas:
   *   get:
   *     summary: Obtener estadísticas de verificaciones
   *     tags: [Verificaciones KYC]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas exitosamente
   */
  router.get('/estadisticas',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => verificacionKYCController.obtenerEstadisticas(req, res)
  );

  return router;
};