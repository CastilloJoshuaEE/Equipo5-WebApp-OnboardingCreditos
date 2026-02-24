// backend/interfaces/routes/contactos-bancarios.routes.js

const express = require('express');
const router = express.Router();

module.exports = (contactosBancariosController, authMiddleware) => {
  /**
   * @swagger
   * tags:
   *   - name: Contactos Bancarios
   *     description: Endpoints para gestión de contactos bancarios
   */

  /**
   * @swagger
   * /api/contactos-bancarios/buscar:
   *   get:
   *     summary: Buscar contactos por numero de cuenta
   *     tags: [Contactos Bancarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: numero de cuenta
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Contactos encontrados exitosamente
   */
  router.get('/buscar',
    authMiddleware.proteger,
    (req, res) => contactosBancariosController.buscarContactosPorNumeroCuenta(req, res)
  );


  /**
   * @swagger
   * /api/contactos-bancarios:
   *   get:
   *     summary: Obtener todos los contactos bancarios
   *     tags: [Contactos Bancarios]
   *     description: Obtiene todos los contactos bancarios del sistema (solo operadores)
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de contactos bancarios obtenida exitosamente
   */
  router.get('/',
    authMiddleware.proteger,
    (req, res) => contactosBancariosController.obtenerTodosContactos(req, res)
  );
  /**
   * @swagger
   * /api/contactos-bancarios/mis-contactos:
   *   get:
   *     summary: Obtener mis contactos bancarios
   *     tags: [Contactos Bancarios]
   *     description: Obtiene los contactos bancarios del operador autenticado
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de contactos bancarios obtenida exitosamente
   */
  router.get('/mis-contactos',
    authMiddleware.proteger,
    (req, res) => contactosBancariosController.obtenerMisContactos(req, res)
  );

  /**
   * @swagger
   * /api/contactos-bancarios:
   *   post:
   *     summary: Crear nuevo contacto bancario
   *     tags: [Contactos Bancarios]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - numero_cuenta
   *               - email_contacto
   *             properties:
   *               numero_cuenta:
   *                 type: string
   *               tipo_cuenta:
   *                 type: string
   *                 enum: [ahorros, corriente]
   *               moneda:
   *                 type: string
   *                 enum: [USD, ARS]
   *               nombre_banco:
   *                 type: string
   *               email_contacto:
   *                 type: string
   *                 format: email
   *               telefono_contacto:
   *                 type: string
   *     responses:
   *       201:
   *         description: Contacto creado exitosamente
   */
  router.post('/',
    authMiddleware.proteger,
    (req, res) => contactosBancariosController.crearContacto(req, res)
  );

  /**
   * @swagger
   * /api/contactos-bancarios/{id}:
   *   put:
   *     summary: Editar contacto bancario existente
   *     tags: [Contactos Bancarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
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
   *             properties:
   *               numero_cuenta:
   *                 type: string
   *               tipo_cuenta:
   *                 type: string
   *                 enum: [ahorros, corriente]
   *               moneda:
   *                 type: string
   *                 enum: [USD, ARS]
   *               nombre_banco:
   *                 type: string
   *               email_contacto:
   *                 type: string
   *                 format: email
   *               telefono_contacto:
   *                 type: string
   *     responses:
   *       200:
   *         description: Contacto actualizado exitosamente
   */
  router.put('/:id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => contactosBancariosController.editarContacto(req, res)
  );


  /**
   * @swagger
   * /api/contactos-bancarios/{id}:
   *   delete:
   *     summary: Eliminar contacto bancario
   *     tags: [Contactos Bancarios]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Contacto eliminado exitosamente
   */
  router.delete('/:id',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => contactosBancariosController.eliminarContacto(req, res)
  );

  /**
   * @swagger
   * /api/contactos-bancarios/estadisticas:
   *   get:
   *     summary: Obtener estadísticas de contactos
   *     tags: [Contactos Bancarios]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas exitosamente
   */
  router.get('/estadisticas',
    authMiddleware.proteger,
    authMiddleware.autorizar('operador'),
    (req, res) => contactosBancariosController.obtenerEstadisticas(req, res)
  );

  return router;
};