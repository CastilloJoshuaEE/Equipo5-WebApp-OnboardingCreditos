// backend/interfaces/routes/index.js
const express = require("express");
const router = express.Router();

module.exports = (dependencies) => {
  const {
    authController,
    usuarioController,
    operadorController,
    documentoController,
    confirmacionController,
    chatbotController,
    comentariosController,
    contactosBancariosController,
    contratoController,
    firmaDigitalController,
    notificacionesController,
    webhooksController,
    verificacionKYCController,
    plantillasDocumentoController,
    reactivacionController,
    transferenciasBancariasController,
    authMiddleware,
    uploadMiddleware,
  solicitudesController,
  emailValidator
  } = dependencies;

  const authRoutes = require('./auth.routes')(authController, confirmacionController, reactivacionController);
  const usuariosPublicRoutes = require('./usuarios.public.routes')(usuarioController, authMiddleware, emailValidator);
  const usuariosAutenticadosRoutes = require('./usuarios.private.routes')(usuarioController, authMiddleware);
  const operadoresRoutes = require('./operador.routes')(operadorController, authMiddleware);
  const solicitudesRoutes = require('./solicitudes.routes')(
    authMiddleware,
    uploadMiddleware,
    documentoController,
    solicitudesController,
    comentariosController
  );
  const documentosRoutes = require('./documentos.routes')(documentoController, authMiddleware, uploadMiddleware);
  const chatbotRoutes = require('./chatbot.routes')(chatbotController, authMiddleware);
  const comentariosRoutes = require('./comentarios.routes')(comentariosController, authMiddleware);
  const contactosBancariosRoutes = require('./contactos-bancarios.routes')(contactosBancariosController, authMiddleware);
  const contratosRoutes = require('./contratos.routes')(contratoController, authMiddleware);
  const firmasRoutes = require('./firmas.routes')(firmaDigitalController, authMiddleware);
  const notificacionesRoutes = require('./notificaciones.routes')(notificacionesController, authMiddleware);
  const webhooksRoutes = require('./webhooks.routes')(webhooksController);
  const verificacionesKYCRoutes = require('./verificaciones-kyc.routes')(verificacionKYCController, authMiddleware);
  const plantillasRoutes = require('./plantillas.routes')(plantillasDocumentoController, authMiddleware, uploadMiddleware);
  const reactivacionRoutes = require('./reactivacion.routes')(reactivacionController);
  const transferenciasRoutes = require('./transferencias.routes')(transferenciasBancariasController, authMiddleware);

  // Montar rutas
  router.use("/auth", authRoutes);
  router.use("/usuarios", usuariosPublicRoutes);
  router.use("/usuarioautenticado", usuariosAutenticadosRoutes);
  router.use("/operadores", operadoresRoutes);
  router.use("/solicitudes", solicitudesRoutes);
  router.use("/documentos", documentosRoutes);
  router.use("/chatbot", chatbotRoutes);
  router.use("/comentarios", comentariosRoutes);
  router.use("/contactos-bancarios", contactosBancariosRoutes);
  router.use("/contratos", contratosRoutes);
  router.use("/firmas", firmasRoutes);
  router.use("/notificaciones", notificacionesRoutes);
  router.use("/webhooks", webhooksRoutes);
  router.use("/verificaciones-kyc", verificacionesKYCRoutes);
  router.use("/plantillas", plantillasRoutes);
  router.use("/reactivacion", reactivacionRoutes);
  router.use("/transferencias", transferenciasRoutes);

  // Health check
  router.get("/health", (req, res) => {
    res.json({
      status: "OK",
      message: "Servidor funcionando",
      timestamp: new Date().toISOString(),
    });
  });

  return router;
};