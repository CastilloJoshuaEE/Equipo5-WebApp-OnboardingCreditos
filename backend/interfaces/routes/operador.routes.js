// backend/interfaces/routes/operador.routes.js
const express = require('express');
const router = express.Router();

module.exports = (operadorController, authMiddleware) => {
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

  return router;
};