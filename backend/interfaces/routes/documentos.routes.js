// backend/interfaces/routes/documentos.routes.js
const express = require('express');

const router = express.Router();


module.exports = (documentoController, authMiddleware, uploadMiddleware) => {
  /**
   * @swagger
   * tags:
   *   - name: Documentos
   *     description: Endpoints para gestión de documentos
   */

  /**
   * @swagger
   * /api/documentos/solicitud/{solicitud_id}:
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
   *         description: Lista de documentos
   */
  router.get('/solicitud/:solicitud_id',
    authMiddleware.proteger,
    (req, res) => documentoController.obtenerDocumentosSolicitud(req, res)
  );


  /**
   * @swagger
   * /api/documentos/solicitud/{solicitud_id}:
   *   post:
   *     summary: Subir documento a solicitud
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
  router.post('/solicitud/:solicitud_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('solicitante'),
    uploadMiddleware.single('archivo'),
    (req, res) => documentoController.subirDocumento(req, res)
  );

  /**
   * @swagger
   * /api/documentos/{documento_id}/validar:
   *   put:
   *     summary: Validar documento (Operador)
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documento_id
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
   *               - estado
   *             properties:
   *               estado:
   *                 type: string
   *                 enum: [validado, rechazado]
   *               comentarios:
   *                 type: string
   *     responses:
   *       200:
   *         description: Documento validado exitosamente
   */
  router.put('/:documento_id/validar',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => documentoController.validarDocumento(req, res)
  );

  /**
   * @swagger
   * /api/documentos/{documento_id}/descargar:
   *   get:
   *     summary: Descargar documento
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documento_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Documento descargado exitosamente
   */
  router.get('/:documento_id/descargar',
    authMiddleware.proteger,
    (req, res) => documentoController.descargarDocumento(req, res)
  );
  /**
   * @swagger
   * /api/documentos/{documento_id}:
   *   put:
   *     summary: Actualizar documento existente
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documento_id
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
   *       200:
   *         description: Documento actualizado exitosamente
   */
  router.put('/:documento_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('solicitante'),
    uploadMiddleware.single('archivo'),
    (req, res) => documentoController.actualizarDocumento(req, res)
  );

  /**
   * @swagger
   * /api/documentos/{documento_id}:
   *   delete:
   *     summary: Eliminar documento
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documento_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Documento eliminado exitosamente
   */
  router.delete('/:documento_id',
    authMiddleware.proteger,
    authMiddleware.autorizar('solicitante'),
    (req, res) => documentoController.eliminarDocumento(req, res)
  );

  /**
   * @swagger
   * /api/documentos/{documento_id}/evaluar:
   *   post:
   *     summary: Evaluar documento con criterios específicos
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documento_id
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
   *               - criterios
   *             properties:
   *               criterios:
   *                 type: object
   *               comentarios:
   *                 type: string
   *               estado:
   *                 type: string
   *                 enum: [validado, pendiente, rechazado]
   *     responses:
   *       200:
   *         description: Documento evaluado exitosamente
   */
  router.post('/:documento_id/evaluar',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => documentoController.evaluarDocumento(req, res)
  );

  /**
   * @swagger
   * /api/documentos/{documento_id}/historial-evaluaciones:
   *   get:
   *     summary: Obtener historial de evaluaciones de documento
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: documento_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Historial obtenido exitosamente
   */
  router.get('/:documento_id/historial-evaluaciones',
    authMiddleware.proteger,
    (req, res) => documentoController.obtenerHistorialEvaluaciones(req, res)
  );

  /**
   * @swagger
   * /api/documentos/solicitudes/{solicitud_id}/contrato/documentos-completos:
   *   get:
   *     summary: Obtener documentos completos de contrato
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
   *         description: Documentos completos obtenidos
   */
  router.get('/solicitudes/:solicitud_id/contrato/documentos-completos',
    authMiddleware.proteger,
    (req, res) => documentoController.obtenerDocumentosContrato(req, res)
  );

  /**
   * @swagger
   * /api/documentos/solicitudes/{solicitud_id}/documentos-storage:
   *   get:
   *     summary: Listar documentos del storage
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
   *         description: Lista de documentos obtenida
   */
  router.get('/solicitudes/:solicitud_id/documentos-storage',
    authMiddleware.proteger,
    (req, res) => documentoController.listarDocumentosStorage(req, res)
  );

  /**
   * @swagger
   * /api/documentos/solicitudes/{solicitud_id}/comprobantes:
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
   *         description: Comprobantes obtenidos
   */
  router.get('/solicitudes/:solicitud_id/comprobantes',
    authMiddleware.proteger,
    (req, res) => documentoController.obtenerComprobantesTransferencia(req, res)
  );

  /**
   * @swagger
   * /api/documentos/contrato/{contrato_id}/descargar:
   *   get:
   *     summary: Descargar contrato
   *     tags: [Documentos]
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
  router.get('/contrato/:contrato_id/descargar',
    authMiddleware.proteger,
    (req, res) => documentoController.descargarContrato(req, res)
  );

  /**
   * @swagger
   * /api/documentos/comprobante/{transferencia_id}/descargar:
   *   get:
   *     summary: Descargar comprobante de transferencia
   *     tags: [Documentos]
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
   *         description: Comprobante descargado exitosamente
   */
  router.get('/comprobante/:transferencia_id/descargar',
    authMiddleware.proteger,
    (req, res) => documentoController.descargarComprobante(req, res)
  );

  /**
   * @swagger
   * /api/documentos/{tipo}/{id}/ver:
   *   get:
   *     summary: Ver documento en navegador
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: tipo
   *         required: true
   *         schema:
   *           type: string
   *           enum: [contrato, comprobante, documento]
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Documento mostrado exitosamente
   */
  router.get('/:tipo/:id/ver',
    authMiddleware.proteger,
    (req, res) => documentoController.verDocumento(req, res)
  );

  /**
   * @swagger
   * /api/documentos/mis-solicitudes:
   *   get:
   *     summary: Obtener mis solicitudes con documentos disponibles
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Solicitudes obtenidas exitosamente
   */
  router.get('/mis-solicitudes',
    authMiddleware.proteger,
    (req, res) => documentoController.obtenerMisSolicitudesConDocumentos(req, res)
  );

  /**
   * @swagger
   * /api/documentos/todos:
   *   get:
   *     summary: Obtener todos los documentos (operador)
   *     tags: [Documentos]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Documentos obtenidos exitosamente
   */
  router.get('/todos',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => documentoController.obtenerTodosLosDocumentos(req, res)
  );

  return router;
};