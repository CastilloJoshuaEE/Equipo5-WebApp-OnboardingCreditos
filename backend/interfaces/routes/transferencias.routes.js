// backend/interfaces/routes/transferencias.routes.js
const express = require('express');
const router = express.Router();

module.exports = (transferenciasBancariasController, authMiddleware) => {
  /**
   * @swagger
   * tags:
   *   - name: Transferencias
   *     description: Endpoints para gestión de transferencias bancarias
   */
/**
 * @swagger
 * /api/transferencias/{transferencia_id}/ver-comprobante:
 *   get:
 *     summary: Ver comprobante de transferencia en el navegador
 *     tags: [Transferencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transferencia_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comprobante mostrado exitosamente
 *       404:
 *         description: Comprobante no encontrado
 */
router.get('/:transferencia_id/ver-comprobante',
  authMiddleware.proteger,
  (req, res) => transferenciasBancariasController.verComprobante(req, res)
);
  /**
   * @swagger
   * /api/transferencias/habilitacion/{solicitud_id}:
   *   get:
   *     summary: Verificar habilitación para transferencia
   *     tags: [Transferencias]
   *     description: Verifica si una solicitud está habilitada para realizar transferencia
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
   *         description: Estado de habilitación obtenido
   *       401:
   *         $ref: '#/components/responses/NoAutorizado'
   */
  router.get('/habilitacion/:solicitud_id',
    authMiddleware.proteger,
    (req, res) => transferenciasBancariasController.verificarHabilitacionTransferencia(req, res)
  );

  /**
   * @swagger
   * /api/transferencias:
   *   post:
   *     summary: Crear nueva transferencia bancaria
   *     tags: [Transferencias]
   *     description: Crea una nueva transferencia bancaria (solo operadores)
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
   *               - contacto_bancario_id
   *               - monto
   *             properties:
   *               solicitud_id:
   *                 type: string
   *                 format: uuid
   *               contacto_bancario_id:
   *                 type: string
   *                 format: uuid
   *               monto:
   *                 type: number
   *                 minimum: 0.01
   *               concepto:
   *                 type: string
   *               moneda:
   *                 type: string
   *                 enum: [ARS, USD]
   *                 default: ARS
   *     responses:
   *       201:
   *         description: Transferencia creada exitosamente
   *       400:
   *         description: Datos inválidos
   *       401:
   *         $ref: '#/components/responses/NoAutorizado'
   *       403:
   *         $ref: '#/components/responses/Prohibido'
   */
  router.post('/',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => transferenciasBancariasController.crearTransferencia(req, res)
  );

  /**
   * @swagger
   * /api/transferencias/comprobante/{transferencia_id}:
   *   get:
   *     summary: Obtener comprobante de transferencia
   *     tags: [Transferencias]
   *     description: Obtiene el comprobante de una transferencia específica
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: transferencia_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID de la transferencia
   *     responses:
   *       200:
   *         description: Comprobante obtenido exitosamente
   *       401:
   *         $ref: '#/components/responses/NoAutorizado'
   *       404:
   *         description: Transferencia no encontrada
   */
  router.get('/comprobante/:transferencia_id',
    authMiddleware.proteger,
    (req, res) => transferenciasBancariasController.obtenerComprobante(req, res)
  );

  /**
   * @swagger
   * /api/transferencias/historial:
   *   get:
   *     summary: Obtener historial de transferencias
   *     tags: [Transferencias]
   *     description: Obtiene el historial de transferencias del usuario autenticado
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Historial obtenido exitosamente
   *       401:
   *         $ref: '#/components/responses/NoAutorizado'
   */
  router.get('/historial',
    authMiddleware.proteger,
    (req, res) => transferenciasBancariasController.obtenerHistorial(req, res)
  );

  /**
   * @swagger
   * /api/transferencias/mis-transferencias:
   *   get:
   *     summary: Obtener mis transferencias (solicitante)
   *     tags: [Transferencias]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Transferencias obtenidas exitosamente
   */
  router.get('/mis-transferencias',
    authMiddleware.proteger,
    (req, res) => transferenciasBancariasController.obtenerMisTransferencias(req, res)
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
  router.post('/forzar-actualizacion/:solicitud_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => transferenciasBancariasController.forzarActualizacionEstado(req, res)
  );

  /**
   * @swagger
   * /api/transferencias/estadisticas:
   *   get:
   *     summary: Obtener estadísticas de transferencias
   *     tags: [Transferencias]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas exitosamente
   */
  router.get('/estadisticas',
    authMiddleware.proteger,
    (req, res) => transferenciasBancariasController.obtenerEstadisticas(req, res)
  );

  /**
   * @swagger
   * /api/transferencias/verificar-firma/{solicitud_id}:
   *   get:
   *     summary: Verificar estado de firma específico
   *     tags: [Transferencias]
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
  router.get('/verificar-firma/:solicitud_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => transferenciasBancariasController.verificarFirma(req, res)
  );

  return router;
};
