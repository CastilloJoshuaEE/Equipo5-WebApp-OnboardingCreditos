// backend/interfaces/routes/webhooks.routes.js
const express = require('express');
const router = express.Router();

module.exports = (webhooksController) => {
  // ==================== RUTAS DE WEBHOOKS ====================

  router.get("/airSlate", (req, res) => res.status(200).send("OK"));

  router.post("/airSlate", (req, res) => {
    res.status(200).json({ success: true });
  });

  /**
   * @swagger
   * /api/webhooks/didit:
   *   post:
   *     summary: Webhook para recibir notificaciones de Didit
   *     tags: [Webhooks]
   *     description: Endpoint público para recibir webhooks de Didit sobre verificaciones KYC
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               session_id:
   *                 type: string
   *               status:
   *                 type: string
   *               webhook_type:
   *                 type: string
   *               decision:
   *                 type: object
   *     responses:
   *       200:
   *         description: Webhook procesado exitosamente
   *       401:
   *         description: Firma de webhook inválida
   *       404:
   *         description: Verificación no encontrada
   */
  router.post('/didit', (req, res) => webhooksController.handleDiditWebhook(req, res));

  return router;
};