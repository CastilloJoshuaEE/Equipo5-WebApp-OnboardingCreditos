// backend/interfaces/routes/firmas.routes.js
const express = require('express');
const router = express.Router();

module.exports = (firmaDigitalController, authMiddleware) => {
  /**
   * @swagger
   * tags:
   *   - name: Firmas Digitales
   *     description: Endpoints para gestión de firmas digitales
   */

  /**
   * @swagger
   * /api/firmas/iniciar-proceso/{solicitud_id}:
   *   post:
   *     summary: Iniciar proceso de firma digital
   *     tags: [Firmas Digitales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: solicitud_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               forzar_reinicio:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Proceso de firma iniciado exitosamente
   */
  router.post('/iniciar-proceso/:solicitud_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador', 'solicitante'),
    (req, res) => firmaDigitalController.iniciarProcesoFirma(req, res)
  );

  /**
   * @swagger
   * /api/firmas/info-firma-word/{firma_id}:
   *   get:
   *     summary: Obtener información para firma Word
   *     tags: [Firmas Digitales]
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
   *         description: Información de firma obtenida exitosamente
   */
  router.get('/info-firma-word/:firma_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador', 'solicitante'),
    (req, res) => firmaDigitalController.obtenerInfoFirma(req, res)
  );

  /**
   * @swagger
   * /api/firmas/procesar-firma-word/{firma_id}:
   *   post:
   *     summary: Procesar firma Word
   *     tags: [Firmas Digitales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: firma_id
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
   *             required:
   *               - firma_data
   *               - tipo_firma
   *             properties:
   *               firma_data:
   *                 type: object
   *               tipo_firma:
   *                 type: string
   *                 enum: [solicitante, operador]
   *     responses:
   *       200:
   *         description: Firma procesada exitosamente
   */
  router.post('/procesar-firma-word/:firma_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador', 'solicitante'),
    (req, res) => firmaDigitalController.procesarFirma(req, res)
  );

  /**
   * @swagger
   * /api/firmas/descargar/{firma_id}:
   *   get:
   *     summary: Descargar documento firmado
   *     tags: [Firmas Digitales]
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
   *         description: Documento descargado exitosamente
   */
  router.get('/descargar/:firma_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador', 'solicitante'),
    (req, res) => firmaDigitalController.descargarDocumentoFirmado(req, res)
  );

  /**
   * @swagger
   * /api/firmas/descargar-contrato-firmado/{firma_id}:
   *   get:
   *     summary: Descargar contrato firmado específico
   *     tags: [Firmas Digitales]
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
   *         description: Contrato firmado descargado exitosamente
   */
  router.get('/descargar-contrato-firmado/:firma_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador', 'solicitante'),
    (req, res) => firmaDigitalController.descargarContratoFirmadoEspecifico(req, res)
  );

  /**
   * @swagger
   * /api/firmas/estado/{firma_id}:
   *   get:
   *     summary: Verificar estado de firma
   *     tags: [Firmas Digitales]
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
   *         description: Estado obtenido exitosamente
   */
  router.get('/estado/:firma_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador', 'solicitante'),
    (req, res) => firmaDigitalController.verificarEstadoFirma(req, res)
  );

  /**
   * @swagger
   * /api/firmas/pendientes:
   *   get:
   *     summary: Obtener firmas pendientes
   *     tags: [Firmas Digitales]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de firmas pendientes obtenida
   */
  router.get('/pendientes',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador', 'solicitante'),
    (req, res) => firmaDigitalController.obtenerFirmasPendientes(req, res)
  );

  /**
   * @swagger
   * /api/firmas/auditoria/{firma_id}:
   *   get:
   *     summary: Obtener auditoría de firma
   *     tags: [Firmas Digitales]
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
   *         description: Auditoría obtenida exitosamente
   */
  router.get('/auditoria/:firma_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador', 'solicitante'),
    (req, res) => firmaDigitalController.obtenerAuditoriaFirma(req, res)
  );

  /**
   * @swagger
   * /api/firmas/estadisticas:
   *   get:
   *     summary: Obtener estadísticas de firmas
   *     tags: [Firmas Digitales]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas exitosamente
   */
  router.get('/estadisticas',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador', 'solicitante'),
    (req, res) => firmaDigitalController.obtenerEstadisticasFirmas(req, res)
  );

  /**
   * @swagger
   * /api/firmas/renovar-expirada/{firma_id}:
   *   post:
   *     summary: Renovar firma expirada
   *     tags: [Firmas Digitales]
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
   *         description: Firma renovada exitosamente
   */
  router.post('/renovar-expirada/:firma_id',
    authMiddleware.proteger,
    (req, res) => firmaDigitalController.renovarFirmaExpirada(req, res)
  );

  /**
   * @swagger
   * /api/firmas/reparar-relacion/{firma_id}:
   *   post:
   *     summary: Reparar relación firma-contrato
   *     tags: [Firmas Digitales]
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
   *         description: Relación reparada exitosamente
   */
  router.post('/reparar-relacion/:firma_id',
    authMiddleware.proteger,
    (req, res) => firmaDigitalController.repararRelacionFirmaContrato(req, res)
  );

  /**
   * @swagger
   * /api/firmas/verificar-existente/{solicitud_id}:
   *   get:
   *     summary: Verificar firma existente
   *     tags: [Firmas Digitales]
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
   *         description: Verificación completada
   */
  router.get('/verificar-existente/:solicitud_id',
    authMiddleware.proteger,
    (req, res) => firmaDigitalController.verificarFirmaExistente(req, res)
  );

  /**
   * @swagger
   * /api/firmas/reiniciar-proceso/{solicitud_id}:
   *   post:
   *     summary: Reiniciar proceso de firma
   *     tags: [Firmas Digitales]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: solicitud_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               forzar_reinicio:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Proceso reiniciado exitosamente
   */
  router.post('/reiniciar-proceso/:solicitud_id',
    authMiddleware.proteger,
    (req, res) => firmaDigitalController.reiniciarProcesoFirma(req, res)
  );

  return router;
};