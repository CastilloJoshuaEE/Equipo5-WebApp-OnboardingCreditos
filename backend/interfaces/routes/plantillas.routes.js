// backend/interfaces/routes/plantillas.routes.js
const express = require('express');
const router = express.Router();

module.exports = (plantillasDocumentoController, authMiddleware, uploadMiddleware) => {
  /**
   * @swagger
   * tags:
   *   - name: Plantillas
   *     description: Endpoints para gestión de plantillas de documentos
   */

  /**
   * @swagger
   * /api/plantillas:
   *   get:
   *     summary: Listar plantillas de documentos
   *     description: Obtiene la lista de todas las plantillas de documentos disponibles
   *     tags:
   *       - Plantillas
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       '200':
   *         description: Lista de plantillas obtenida
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         type: object
   *       '401':
   *         $ref: '#/components/responses/NoAutorizado'
   *       '500':
   *         $ref: '#/components/responses/ErrorServidor'
   */
  router.get('/',
    authMiddleware.proteger,
    (req, res) => plantillasDocumentoController.listar(req, res)
  );

  /**
   * @swagger
   * /api/plantillas/buscar:
   *   get:
   *     summary: Buscar plantillas
   *     tags: [Plantillas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Resultados de búsqueda
   */
  router.get('/buscar',
    authMiddleware.proteger,
    (req, res) => plantillasDocumentoController.buscar(req, res)
  );

  /**
   * @swagger
   * /api/plantillas:
   *   post:
   *     summary: Subir nueva plantilla
   *     description: Sube una nueva plantilla de documento al sistema
   *     tags:
   *       - Plantillas
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               archivo:
   *                 type: string
   *                 format: binary
   *                 description: Archivo Word de la plantilla
   *               tipo:
   *                 type: string
   *                 description: Tipo de plantilla
   *     responses:
   *       '200':
   *         description: Plantilla subida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *       '400':
   *         description: No se envió archivo
   *       '401':
   *         $ref: '#/components/responses/NoAutorizado'
   *       '500':
   *         $ref: '#/components/responses/ErrorServidor'
   */
  router.post('/',
    authMiddleware.proteger,
    uploadMiddleware.single('archivo'),
    (req, res) => plantillasDocumentoController.subir(req, res)
  );

  /**
   * @swagger
   * /api/plantillas/{id}:
   *   get:
   *     summary: Obtener plantilla por ID
   *     tags: [Plantillas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Plantilla obtenida
   */
  router.get('/:id',
    authMiddleware.proteger,
    (req, res) => plantillasDocumentoController.obtener(req, res)
  );

  /**
   * @swagger
   * /api/plantillas/{id}:
   *   put:
   *     summary: Actualizar plantilla existente
   *     description: Actualiza una plantilla de documento existente
   *     tags:
   *       - Plantillas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la plantilla
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               archivo:
   *                 type: string
   *                 format: binary
   *                 description: Nuevo archivo Word de la plantilla
   *     responses:
   *       '200':
   *         description: Plantilla actualizada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/SuccessResponse'
   *       '401':
   *         $ref: '#/components/responses/NoAutorizado'
   *       '404':
   *         description: Plantilla no encontrada
   *       '500':
   *         $ref: '#/components/responses/ErrorServidor'
   */
  router.put('/:id',
    authMiddleware.proteger,
    uploadMiddleware.single('archivo'),
    (req, res) => plantillasDocumentoController.actualizar(req, res)
  );

  /**
   * @swagger
   * /api/plantillas/{id}:
   *   delete:
   *     summary: Eliminar plantilla
   *     tags: [Plantillas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Plantilla eliminada
   */
  router.delete('/:id',
    authMiddleware.proteger,
    (req, res) => plantillasDocumentoController.eliminar(req, res)
  );

  /**
   * @swagger
   * /api/plantillas/{id}/descargar:
   *   get:
   *     summary: Descargar plantilla específica
   *     description: Descarga una plantilla de documento específica
   *     tags:
   *       - Plantillas
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       '200':
   *         description: Plantilla descargada exitosamente
   *         content:
   *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
   *             schema:
   *               type: string
   *               format: binary
   *       '401':
   *         $ref: '#/components/responses/NoAutorizado'
   *       '404':
   *         description: Plantilla no encontrada
   *       '500':
   *         $ref: '#/components/responses/ErrorServidor'
   */
  router.get('/:id/descargar',
    authMiddleware.proteger,
    (req, res) => plantillasDocumentoController.descargar(req, res)
  );

  /**
   * @swagger
   * /api/plantillas/{id}/activar:
   *   put:
   *     summary: Activar plantilla
   *     tags: [Plantillas]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Plantilla activada
   */
  router.put('/:id/activar',
    authMiddleware.proteger,
    (req, res) => plantillasDocumentoController.activar(req, res)
  );

  /**
   * @swagger
   * /api/plantillas/estadisticas:
   *   get:
   *     summary: Obtener estadísticas de plantillas
   *     tags: [Plantillas]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas
   */
  router.get('/estadisticas',
    authMiddleware.proteger,
    (req, res) => plantillasDocumentoController.obtenerEstadisticas(req, res)
  );

  return router;
};