// backend/interfaces/routes/comentarios.routes.js
const express = require("express");
const router = express.Router();
module.exports = (comentariosController, authMiddleware) => {

// ==================== RUTAS DE COMENTARIOS ====================

/**
 * @swagger
 * /api/comentarios:
 *   post:
 *     summary: Crear un nuevo comentario
 *     tags: [Comentarios]
 *     description: Crea un comentario en una solicitud. Genera notificación automática al destinatario.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComentarioInput'
 *           examples:
 *             operador_a_solicitante:
 *               summary: Comentario de operador a solicitante
 *               value:
 *                 solicitud_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 comentario: "Hemos revisado su documentación y necesitamos información adicional sobre el comprobante de domicilio reciente."
 *                 tipo: "operador_a_solicitante"
 *             solicitante_a_operador:
 *               summary: Comentario de solicitante a operador
 *               value:
 *                 solicitud_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 comentario: "He subido el documento solicitado. ¿Podrían revisarlo cuando tengan oportunidad?"
 *                 tipo: "solicitante_a_operador"
 *     responses:
 *       201:
 *         description: Comentario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Comentario'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: No tiene permisos para comentar en esta solicitud
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Solicitud no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
  router.post('/', 
    authMiddleware.proteger, 
    (req, res) => comentariosController.crear(req, res)
  );
/**
 * @swagger
 * /api/comentarios/contador-no-leidos:
 *   get:
 *     summary: Obtener contador de comentarios no leídos
 *     tags: [Comentarios]
 *     description: Obtiene el número de comentarios no leídos para el usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contador obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ContadorComentarios'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
  router.get('/contador-no-leidos',
    authMiddleware.proteger,
    (req, res) => comentariosController.obtenerContadorNoLeidos(req, res)
  );
/**
 * @swagger
 * /api/comentarios/{id}:
 *   delete:
 *     summary: Eliminar comentario
 *     tags: [Comentarios]
 *     description: Elimina un comentario. Solo el autor del comentario o un operador pueden eliminarlo.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del comentario a eliminar
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Comentario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: No tiene permisos para eliminar este comentario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comentario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
 router.delete('/:id',
    authMiddleware.proteger,
    (req, res) => comentariosController.eliminar(req, res)
  );

  return router;
};