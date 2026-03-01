// backend/interfaces/routes/operador.routes.js
const express = require('express');
const router = express.Router();

module.exports = (operadorController, documentoController, authMiddleware) => {
  router.get(
    '/dashboard',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => operadorController.obtenerDashboard(req, res)
  );

  router.get(
    '/solicitudes/:solicitud_id/revision',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => operadorController.iniciarRevision(req, res)
  );

  router.put(
    '/solicitudes/:solicitud_id/documentos/:documento_id/validar-balance',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => operadorController.validarBalanceContable(req, res)
  );

  router.get(
    '/health',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => {
      res.json({
        success: true,
        message: 'Operador endpoint funcionando',
        usuario: req.usuario.id,
        timestamp: new Date().toISOString()
      });
    }
  );
  /**
   * @swagger
   * /api/operador/todos-los-documentos:
   *   get:
   *     summary: Obtener todos los documentos del sistema (operador)
   *     tags: [Operador]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Documentos obtenidos exitosamente
   */
  router.get('/todos-los-documentos',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => documentoController.obtenerTodosLosDocumentos(req, res)
  );

  return router;
};