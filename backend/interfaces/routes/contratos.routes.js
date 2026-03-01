// backend/interfaces/routes/contratos.routes.js
const express = require('express');
const router = express.Router();

module.exports = (contratoController, authMiddleware) => {
  /**
   * @swagger
   * tags:
   *   - name: Contratos
   *     description: Endpoints para gestión de contratos
   */

  /**
   * @swagger
   * /api/contratos/solicitud/{solicitud_id}/generar:
   *   post:
   *     summary: Generar contrato para solicitud aprobada
   *     tags: [Contratos]
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
   *         description: Contrato generado exitosamente
   */
  router.post('/solicitud/:solicitud_id/generar',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => contratoController.generarContratoParaSolicitud(req, res)
  );
  /**
   * @swagger
   * /api/contratos/verificar/{firma_id}:
   *   get:
   *     summary: Verificar estado del contrato antes de firma
   *     tags: [Contratos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: firma_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Estado verificado
   */
  router.get('/verificar/:firma_id',
    authMiddleware.proteger,
    (req, res) => contratoController.verificarEstadoContrato(req, res)
  );

  /**
   * @swagger
   * /api/contratos/contenido/{firma_id}:
   *   get:
   *     summary: Obtener contenido del contrato
   *     tags: [Contratos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: firma_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Contenido del contrato obtenido
   */
  router.get('/contenido/:firma_id',
    authMiddleware.proteger,
    (req, res) => contratoController.obtenerContenidoContrato(req, res)
  );

  /**
   * @swagger
   * /api/contratos/usuario:
   *   get:
   *     summary: Obtener contratos del usuario
   *     tags: [Contratos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: estado
   *         schema:
   *           type: string
   *       - in: query
   *         name: tipo
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de contratos del usuario
   */
  router.get('/usuario',
    authMiddleware.proteger,
    (req, res) => contratoController.obtenerContratosUsuario(req, res)
  );
  /**
   * @swagger
   * /api/contratos/estadisticas:
   *   get:
   *     summary: Obtener estadísticas de contratos
   *     tags: [Contratos]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas de contratos
   */
  router.get('/estadisticas',
    authMiddleware.proteger,
    (req, res) => contratoController.obtenerEstadisticas(req, res)
  );


  /**
   * @swagger
   * /api/contratos/{contrato_id}/descargar-firmado:
   *   get:
   *     summary: Descargar contrato firmado
   *     tags: [Contratos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: contrato_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Contrato descargado exitosamente
   */
  router.get('/:contrato_id/descargar-firmado',
    authMiddleware.proteger,
    (req, res) => contratoController.descargarContrato(req, res)
  );


  return router;
};