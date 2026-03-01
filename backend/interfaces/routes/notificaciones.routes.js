// backend/interfaces/routes/notificaciones.routes.js
const express = require('express');
const router = express.Router();

module.exports = (notificacionesController, authMiddleware) =>{
// ==================== RUTAS DE NOTIFICACIONES ====================

/**
 * @swagger
 * /api/notificaciones:
 * get:
 *   summary: Obtener notificaciones del usuario
 *   tags: [Notificaciones]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: query
 *       name: limit
 *       schema:
 *         type: integer
 *       description: Límite de notificaciones
 *     - in: query
 *       name: offset
 *       schema:
 *         type: integer
 *       description: Offset para paginación
 *     - in: query
 *       name: leida
 *       schema:
 *         type: boolean
 *       description: Filtrar por estado de lectura
 *   responses:
 *     200:
 *       description: Lista de notificaciones
 */
  router.get('/',
    authMiddleware.proteger,
    (req, res) => notificacionesController.obtenerNotificaciones(req, res)
  );

/**
 * @swagger
 * /api/notificaciones/contador-no-leidas:
 * get:
 *   summary: Obtener contador de notificaciones no leídas
 *   tags: [Notificaciones]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200:
 *       description: Contador de notificaciones no leídas
 */
router.get('/contador-no-leidas', authMiddleware.proteger,    (req, res) => notificacionesController.obtenerContadorNoLeidas(req, res));

/**
 * @swagger
 * /api/notificaciones/{id}/leer:
 * put:
 *   summary: Marcar notificación como leída
 *   tags: [Notificaciones]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *   responses:
 *     200:
 *       description: Notificación marcada como leída
 */
  router.put('/:id/leer',
    authMiddleware.proteger,
    (req, res) => notificacionesController.marcarComoLeida(req, res)
  );

/**
 * @swagger
 * /api/notificaciones/leer-todas:
 * put:
 *   summary: Marcar todas las notificaciones como leídas
 *   tags: [Notificaciones]
 *   security:
 *     - bearerAuth: []
 *   responses:
 *     200:
 *       description: Todas las notificaciones marcadas como leídas
 */
  router.put('/leer-todas',
    authMiddleware.proteger,
    (req, res) => notificacionesController.marcarTodasComoLeidas(req, res)
  );

  return router;
};