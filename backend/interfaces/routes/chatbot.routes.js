// backend/interfaces/routes/chatbot.routes.js
const express = require("express");
const router = express.Router();

module.exports = (chatbotController, authMiddleware) => {

/**
 * @swagger
 * tags:
 *   - name: Chatbot
 *     description: Endpoints para el chatbot de asistencia
 */

/**
 * @swagger
 * /api/chatbot/mensaje:
 *   post:
 *     summary: Enviar mensaje al chatbot (público)
 *     tags: [Chatbot]
 *     description: Procesa un mensaje del usuario y devuelve respuesta del chatbot. No requiere autenticación.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mensaje
 *             properties:
 *               mensaje:
 *                 type: string
 *                 description: Mensaje del usuario para el chatbot
 *                 example: "¿Qué documentos necesito para solicitar un crédito?"
 *     responses:
 *       200:
 *         description: Respuesta del chatbot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     respuesta:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     usuario:
 *                       type: object
 *                       nullable: true
 */
  router.post('/mensaje', (req, res) => chatbotController.procesarMensajePublico(req, res));

/**
 * @swagger
 * /api/chatbot/mensaje-autenticado:
 *   post:
 *     summary: Procesar mensaje del chatbot (autenticado)
 *     description: Procesa un mensaje del chatbot para usuarios autenticados
 *     tags:
 *       - Chatbot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mensaje
 *             properties:
 *               mensaje:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Mensaje del usuario al chatbot
 *     responses:
 *       '200':
 *         description: Mensaje procesado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         respuesta:
 *                           type: string
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         usuario:
 *                           type: object
 *                           nullable: true
 *       '400':
 *         description: Mensaje vacío o demasiado largo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
  router.post('/mensaje-autenticado', 
    authMiddleware.proteger, 
    (req, res) => chatbotController.procesarMensajeAutenticado(req, res)
  );

/**
 * @swagger
 * /api/chatbot/historial:
 *   get:
 *     summary: Obtener historial del chatbot
 *     description: Obtiene el historial de conversaciones del chatbot para el usuario autenticado
 *     tags:
 *       - Chatbot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Límite de registros a obtener
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginación
 *     responses:
 *       '200':
 *         description: Historial obtenido exitosamente
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
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           usuario_id:
 *                             type: string
 *                             format: uuid
 *                           pregunta:
 *                             type: string
 *                           respuesta:
 *                             type: string
 *                           sentimiento:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       '401':
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
  router.get('/historial',
    authMiddleware.proteger,
    (req, res) => chatbotController.obtenerHistorialUsuario(req, res)
  );

/**
 * @swagger
 * /api/chatbot/health:
 *   get:
 *     summary: Health check del chatbot
 *     description: Verifica que el servicio de chatbot esté funcionando correctamente
 *     tags:
 *       - Chatbot
 *     responses:
 *       '200':
 *         description: Chatbot funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Chatbot funcionando correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     servicio:
 *                       type: string
 *                       example: "Gemini API"
 *                     estado:
 *                       type: string
 *                       example: "activo"
 *                     prueba:
 *                       type: string
 *                       example: "exitosa"
 *       '503':
 *         description: Chatbot temporalmente no disponible
 */
  router.get('/health', (req, res) => chatbotController.verificarHealth(req, res));
  
  return router;
};