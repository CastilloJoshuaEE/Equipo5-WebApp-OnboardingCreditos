// backend/interfaces/routes/solicitudes.routes.js 

const express = require("express");
const router = express.Router();

module.exports = (
    authMiddleware,
    uploadMiddleware,
    documentoController,
    solicitudesController,
    comentariosController
) => {

  // ==================== RUTAS DE SOLICITUDES ====================

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/comentarios:
   *   get:
   *     summary: Obtener comentarios de una solicitud
   *     tags: [Comentarios]
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
   *         description: Lista de comentarios obtenida exitosamente
   */
  router.get('/:solicitud_id/comentarios', 
    authMiddleware.proteger, 
    (req, res) => comentariosController.obtenerPorSolicitud(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes:
   *   post:
   *     summary: Crear nueva solicitud de crédito
   *     tags: [Solicitudes]
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
   *               plazo_meses:
   *                 type: integer
   *               proposito:
   *                 type: string
   *               moneda:
   *                 type: string
   *                 enum: [ARS, USD]
   *                 default: ARS
   *     responses:
   *       201:
   *         description: Solicitud creada exitosamente
   */
  router.post('/', 
    authMiddleware.proteger, 
    (req, res) => solicitudesController.crearSolicitud(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes:
   *   get:
   *     summary: Obtener mis solicitudes
   *     tags: [Solicitudes]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de solicitudes obtenida exitosamente
   */
  router.get('/', 
    authMiddleware.proteger, 
    (req, res) => solicitudesController.obtenerMisSolicitudes(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/mis-solicitudes:
   *   get:
   *     summary: Obtener mis solicitudes (Solicitante)
   *     tags: [Solicitudes]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de solicitudes obtenida exitosamente
   */
  router.get('/mis-solicitudes', 
    authMiddleware.proteger, 
    (req, res) => solicitudesController.obtenerMisSolicitudes(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/enviar:
   *   put:
   *     summary: Enviar solicitud para revisión
   *     tags: [Solicitudes]
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
   *         description: Solicitud enviada exitosamente
   */
  router.put('/:solicitud_id/enviar', 
    authMiddleware.proteger, 
    (req, res) => solicitudesController.enviarSolicitud(req, res)
  );

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
   */
  router.get('/mis-solicitudes-con-documentos', 
    authMiddleware.proteger, 
    (req, res) => documentoController.obtenerMisSolicitudesConDocumentos(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}:
   *   get:
   *     summary: Obtener detalle de una solicitud
   *     tags: [Solicitudes]
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
   *         description: Detalle de solicitud obtenido exitosamente
   */
  router.get('/:solicitud_id', 
    authMiddleware.proteger, 
    (req, res) => solicitudesController.obtenerSolicitudDetalle(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/documentos:
   *   get:
   *     summary: Obtener documentos de una solicitud
   *     tags: [Documentos]
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
   *         description: Lista de documentos obtenida exitosamente
   */
  router.get('/:solicitud_id/documentos', 
    authMiddleware.proteger, 
    (req, res) => documentoController.obtenerDocumentosSolicitud(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/documentos:
   *   post:
   *     summary: Subir documento a una solicitud
   *     tags: [Documentos]
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
   *               tipo:
   *                 type: string
   *                 enum: [dni, cuit, comprobante_domicilio, balance_contable, estado_financiero, declaracion_impuestos]
   *     responses:
   *       201:
   *         description: Documento subido exitosamente
   */
  router.post(
    '/:solicitud_id/documentos',
    authMiddleware.proteger,
    authMiddleware.autorizar('solicitante'),
    uploadMiddleware.single('archivo'),
    (req, res) => documentoController.subirDocumento(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/lista:
   *   get:
   *     summary: Obtener todas las solicitudes (operadores)
   *     tags: [Solicitudes]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de todas las solicitudes
   */
  router.get('/lista', 
    authMiddleware.proteger, 
    authMiddleware.autorizar('operador'), 
    (req, res) => solicitudesController.obtenerTodasSolicitudes(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/asignar:
   *   put:
   *     summary: Asignar operador a solicitud
   *     tags: [Operadores]
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
   *     responses:
   *       200:
   *         description: Operador asignado exitosamente
   */
  router.put('/:solicitud_id/asignar', 
    authMiddleware.proteger, 
    authMiddleware.autorizar('operador'), 
    (req, res) => solicitudesController.asignarOperador(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/aprobar:
   *   put:
   *     summary: Aprobar solicitud de crédito
   *     tags: [Operadores]
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
   *               comentarios:
   *                 type: string
   *               condiciones:
   *                 type: object
   *     responses:
   *       200:
   *         description: Solicitud aprobada exitosamente
   */
  router.put('/:solicitud_id/aprobar', 
    authMiddleware.proteger, 
    authMiddleware.autorizar('operador'), 
    (req, res) => solicitudesController.aprobarSolicitud(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/rechazar:
   *   put:
   *     summary: Rechazar solicitud de crédito
   *     tags: [Operadores]
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
   *     responses:
   *       200:
   *         description: Solicitud rechazada exitosamente
   */
  router.put('/:solicitud_id/rechazar', 
    authMiddleware.proteger, 
    authMiddleware.autorizar('operador'), 
    (req, res) => solicitudesController.rechazarSolicitud(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/solicitar-info:
   *   put:
   *     summary: Solicitar información adicional
   *     tags: [Operadores]
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
   *               plazo_dias:
   *                 type: integer
   *                 minimum: 1
   *                 default: 7
   *     responses:
   *       200:
   *         description: Información adicional solicitada exitosamente
   */
  router.put('/:solicitud_id/solicitar-info', 
    authMiddleware.proteger, 
    authMiddleware.autorizar('operador'), 
    (req, res) => solicitudesController.solicitarInformacionAdicional(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/verificar-kyc:
   *   post:
   *     summary: Iniciar verificación KYC
   *     tags: [KYC/AML]
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
   *         description: Verificación KYC iniciada exitosamente
   */
  router.post('/:solicitud_id/verificar-kyc', 
    authMiddleware.proteger, 
    (req, res) => solicitudesController.iniciarVerificacionKYC(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/contrato/documentos:
   *   get:
   *     summary: Obtener documentos de contrato
   *     tags: [Documentos]
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
   *         description: Documentos de contrato obtenidos
   */
  router.get('/:solicitud_id/contrato/documentos', 
    authMiddleware.proteger, 
    (req, res) => documentoController.obtenerDocumentosContrato(req, res)
  );

  /**
   * @swagger
   * /api/solicitudes/{solicitud_id}/comprobantes:
   *   get:
   *     summary: Obtener comprobantes de transferencia
   *     tags: [Documentos]
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
   *         description: Comprobantes obtenidos exitosamente
   */
  router.get('/:solicitud_id/comprobantes', 
    authMiddleware.proteger, 
    (req, res) => documentoController.obtenerComprobantesTransferencia(req, res)
  );

  return router;
};