// backend/index.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const { createCanvas, Canvas, Image, ImageData } = require('canvas');

// Configuración
const corsOptions = require('./config/cors');
const swaggerSpec = require("./interfaces/docs/swagger.config");

// Database
const { supabaseClient } = require("./infrastructure/database/supabaseClient");
const { verificarConexion } = require("./infrastructure/database/conexion");
const { supabaseAdmin } = require("./infrastructure/database/supabaseAdmin");
const { configurarStorage } = require("./config/configStorage");

// REPOSITORIOS
const SupabaseUsuarioRepository = require("./infrastructure/repositories/SupabaseUsuarioRepository");
const SupabaseSolicitanteRepository = require("./infrastructure/repositories/SupabaseSolicitanteRepository");
const SupabaseOperadorRepository = require("./infrastructure/repositories/SupabaseOperadorRepository");
const SupabaseIntentoLoginRepository = require("./infrastructure/repositories/SupabaseIntentoLoginRepository");
const SupabaseSolicitudRepository = require("./infrastructure/repositories/SupabaseSolicitudRepository");
const SupabaseChatbotRepository = require("./infrastructure/repositories/SupabaseChatbotRepository");
const SupabaseComentarioRepository = require("./infrastructure/repositories/SupabaseComentarioRepository");
const SupabaseContactoBancarioRepository = require("./infrastructure/repositories/SupabaseContactoBancarioRepository");
const SupabaseContratoRepository = require("./infrastructure/repositories/SupabaseContratoRepository");
const SupabaseDocumentoRepository = require("./infrastructure/repositories/SupabaseDocumentoRepository");
const SupabaseFirmaDigitalRepository = require("./infrastructure/repositories/SupabaseFirmaDigitalRepository");
const SupabaseNotificacionRepository = require("./infrastructure/repositories/SupabaseNotificacionRepository");
const SupabaseVerificacionKYCRepository = require("./infrastructure/repositories/SupabaseVerificacionKYCRepository");
const SupabasePlantillaDocumentoRepository = require("./infrastructure/repositories/SupabasePlantillaDocumentoRepository");
const SupabaseReactivacionCuentaRepository = require("./infrastructure/repositories/SupabaseReactivacionCuentaRepository");
const SupabaseTransferenciaBancariaRepository = require("./infrastructure/repositories/SupabaseTransferenciaBancariaRepository");
const SupabaseSolicitudInformacionRepository = require("./infrastructure/repositories/SupabaseSolicitudInformacionRepository");

// SERVICIOS
const GeminiService = require("./infrastructure/services/GeminiService");
const NotificacionService = require("./infrastructure/services/NotificacionService");
const AuthService = require("./infrastructure/services/AuthService");
const BCRAService = require("./infrastructure/services/BCRAService");
const BrevoService = require("./infrastructure/services/email/emailBrevoAPIService");
const DiditService = require('./infrastructure/services/diditService');
const EmailService = require('./infrastructure/services/email/emailServicio');
const emailValidator = require('./infrastructure/services/email/emailValidarServicio');
const WordService = require('./infrastructure/services/WordService');
const NotificacionEmailService = require("./application/services/NotificacionEmailService");

// USE CASES - AUTH
const LoginUsuarioUseCase = require("./application/use-cases/auth/LoginUsuario");
const RegistrarUsuarioUseCase = require("./application/use-cases/auth/RegistrarUsuario");
const RefrescarTokenUseCase = require("./application/use-cases/auth/RefrescarToken");
const CerrarSesionUseCase = require("./application/use-cases/auth/CerrarSesion");
const ObtenerSesionUseCase = require("./application/use-cases/auth/ObtenerSesion");

// USE CASES - USUARIO
const ObtenerPerfilUseCase = require('./application/use-cases/usuario/ObtenerPerfil');
const ObtenerPerfilPorIdUseCase = require('./application/use-cases/usuario/ObtenerPerfilPorId');
const ObtenerPerfilUsuarioUseCase = require('./application/use-cases/usuario/ObtenerPerfilUsuario');
const ActualizarPerfilUseCase = require('./application/use-cases/usuario/ActualizarPerfil');
const ActualizarPerfilPorIdUseCase = require('./application/use-cases/usuario/ActualizarPerfilPorId');
const CambiarContrasenaUseCase = require('./application/use-cases/usuario/CambiarContrasena');
const RecuperarContrasenaUseCase = require('./application/use-cases/usuario/RecuperarContrasena');
const SolicitarRecuperacionCuentaUseCase = require('./application/use-cases/usuario/SolicitarRecuperacionCuenta');
const DesactivarCuentaUseCase = require('./application/use-cases/usuario/DesactivarCuenta');
const ActualizarEmailRecuperacionUseCase = require('./application/use-cases/usuario/ActualizarEmailRecuperacion');
const VerificarEstadoCuentaUseCase = require('./application/use-cases/usuario/VerificarEstadoCuenta');
const ObtenerConfiguracionCuentaUseCase = require('./application/use-cases/usuario/ObtenerConfiguracionCuenta');
const EliminarCuentaUseCase = require('./application/use-cases/usuario/EliminarCuenta');
const GestionUsuariosUseCase = require('./application/use-cases/usuario/GestionUsuarios');

// USE CASES - OPERADOR
const ObtenerDashboardUseCase = require("./application/use-cases/operador/ObtenerDashboard");
const IniciarRevisionSolicitudUseCase = require("./application/use-cases/operador/IniciarRevisionSolicitud");
const ValidarDocumentoOperadorUseCase = require("./application/use-cases/operador/ValidarDocumento");

// USE CASES - CHATBOT
const ProcesarMensajeUseCase = require("./application/use-cases/chatbot/ProcesarMensaje");
const ObtenerHistorialChatbotUseCase = require("./application/use-cases/chatbot/ObtenerHistorial");
const BuscarEnHistorialChatbotUseCase = require("./application/use-cases/chatbot/BuscarEnHistorial");
const ObtenerEstadisticasChatbotUseCase = require("./application/use-cases/chatbot/ObtenerEstadisticasChatbot");
const EliminarHistorialChatbotUseCase = require("./application/use-cases/chatbot/EliminarHistorialChatbot");
const HealthCheckChatbotUseCase = require("./application/use-cases/chatbot/HealthCheckChatbot");

// USE CASES - COMENTARIOS
const CrearComentarioUseCase = require("./application/use-cases/comentarios/CrearComentario");
const ObtenerComentariosSolicitudUseCase = require("./application/use-cases/comentarios/ObtenerComentariosSolicitud");
const ObtenerContadorNoLeidosUseCase = require("./application/use-cases/comentarios/ObtenerContadorNoLeidos");
const EliminarComentarioUseCase = require("./application/use-cases/comentarios/EliminarComentario");
const ObtenerEstadisticasComentariosUseCase = require("./application/use-cases/comentarios/ObtenerEstadisticasComentarios");
const BuscarComentariosUseCase = require("./application/use-cases/comentarios/BuscarComentarios");

// USE CASES - CONTACTOS BANCARIOS
const ObtenerContactosOperadorUseCase = require("./application/use-cases/contactos/ObtenerContactosOperador");
const BuscarContactosPorNumeroCuentaUseCase = require("./application/use-cases/contactos/BuscarContactosPorNumeroCuenta");
const ObtenerTodosContactosUseCase = require("./application/use-cases/contactos/ObtenerTodosContactos");
const CrearContactoBancarioUseCase = require("./application/use-cases/contactos/CrearContactoBancario");
const ObtenerMisContactosUseCase = require("./application/use-cases/contactos/ObtenerMisContactos");
const EditarContactoBancarioUseCase = require("./application/use-cases/contactos/EditarContactoBancario");
const EliminarContactoBancarioUseCase = require("./application/use-cases/contactos/EliminarContactoBancario");
const ObtenerEstadisticasContactosUseCase = require("./application/use-cases/contactos/ObtenerEstadisticasContactos");

// USE CASES - CONTRATOS
const GenerarContratoParaSolicitudUseCase = require("./application/use-cases/contratos/GenerarContratoParaSolicitud");
const VerificarEstadoContratoUseCase = require("./application/use-cases/contratos/VerificarEstadoContrato");
const ObtenerContenidoContratoUseCase = require("./application/use-cases/contratos/ObtenerContenidoContrato");
const ObtenerContratosUsuarioUseCase = require("./application/use-cases/contratos/ObtenerContratosUsuario");
const ObtenerEstadisticasContratosUseCase = require("./application/use-cases/contratos/ObtenerEstadisticasContratos");

// USE CASES - DOCUMENTOS
const SubirDocumentoUseCase = require("./application/use-cases/documentos/SubirDocumento");
const ObtenerDocumentosSolicitudUseCase = require("./application/use-cases/documentos/ObtenerDocumentosSolicitud");
const ValidarDocumentoUseCase = require("./application/use-cases/documentos/ValidarDocumento");
const DescargarDocumentoUseCase = require("./application/use-cases/documentos/DescargarDocumento");
const ActualizarDocumentoUseCase = require("./application/use-cases/documentos/ActualizarDocumento");
const EliminarDocumentoUseCase = require("./application/use-cases/documentos/EliminarDocumento");
const EvaluarDocumentoUseCase = require("./application/use-cases/documentos/EvaluarDocumento");
const ObtenerHistorialEvaluacionesUseCase = require("./application/use-cases/documentos/ObtenerHistorialEvaluaciones");
const ObtenerDocumentosContratoUseCase = require("./application/use-cases/documentos/ObtenerDocumentosContrato");
const ListarDocumentosStorageUseCase = require("./application/use-cases/documentos/ListarDocumentosStorage");
const ObtenerComprobantesTransferenciaUseCase = require("./application/use-cases/documentos/ObtenerComprobantesTransferencia");
const DescargarContratoUseCase = require("./application/use-cases/documentos/DescargarContrato");
const DescargarComprobanteUseCase = require("./application/use-cases/documentos/DescargarComprobante");
const VerDocumentoUseCase = require("./application/use-cases/documentos/VerDocumento");
const ObtenerMisSolicitudesConDocumentosUseCase = require("./application/use-cases/documentos/ObtenerMisSolicitudesConDocumentos");
const ObtenerTodosLosDocumentosUseCase = require("./application/use-cases/documentos/ObtenerTodosLosDocumentos");

// USE CASES - FIRMAS DIGITALES
const IniciarProcesoFirmaUseCase = require("./application/use-cases/firmas/IniciarProcesoFirma");
const ObtenerInfoFirmaUseCase = require("./application/use-cases/firmas/ObtenerInfoFirma");
const ProcesarFirmaUseCase = require("./application/use-cases/firmas/ProcesarFirma");
const DescargarDocumentoFirmadoUseCase = require("./application/use-cases/firmas/DescargarDocumentoFirmado");
const ObtenerFirmasPendientesUseCase = require("./application/use-cases/firmas/ObtenerFirmasPendientes");
const ObtenerAuditoriaFirmaUseCase = require("./application/use-cases/firmas/ObtenerAuditoriaFirma");
const ObtenerEstadisticasFirmasUseCase = require("./application/use-cases/firmas/ObtenerEstadisticasFirmas");
const RenovarFirmaExpiradaUseCase = require("./application/use-cases/firmas/RenovarFirmaExpirada");
const RepararRelacionFirmaContratoUseCase = require("./application/use-cases/firmas/RepararRelacionFirmaContrato");
const VerificarFirmaExistenteUseCase = require("./application/use-cases/firmas/VerificarFirmaExistente");
const ReiniciarProcesoFirmaUseCase = require("./application/use-cases/firmas/ReiniciarProcesoFirma");

// USE CASES - NOTIFICACIONES
const ObtenerNotificacionesUseCase = require("./application/use-cases/notificaciones/ObtenerNotificaciones");
const ObtenerContadorNoLeidasUseCase = require("./application/use-cases/notificaciones/ObtenerContadorNoLeidas");
const MarcarComoLeidaUseCase = require("./application/use-cases/notificaciones/MarcarComoLeida");
const MarcarTodasComoLeidasUseCase = require("./application/use-cases/notificaciones/MarcarTodasComoLeidas");
const NotificarFirmaSolicitanteCompletada = require("./application/use-cases/notificaciones/NotificarFirmaSolicitanteCompletada");
const NotificarFirmaOperadorCompletada = require("./application/use-cases/notificaciones/NotificarFirmaOperadorCompletada");
const NotificarFirmaCompletada = require("./application/use-cases/notificaciones/NotificarFirmaCompletada");
// USE CASES - WEBHOOKS
const ProcesarWebhookDiditUseCase = require("./application/use-cases/webhooks/ProcesarWebhookDidit");

// USE CASES - VERIFICACIONES KYC
const CrearVerificacionKYCUseCase = require("./application/use-cases/verificaciones/CrearVerificacionKYC");
const ObtenerVerificacionPorIdUseCase = require("./application/use-cases/verificaciones/ObtenerVerificacionPorId");
const ObtenerVerificacionesPorSolicitudUseCase = require("./application/use-cases/verificaciones/ObtenerVerificacionesPorSolicitud");
const ObtenerVerificacionPorSessionIdUseCase = require("./application/use-cases/verificaciones/ObtenerVerificacionPorSessionId");
const ActualizarVerificacionUseCase = require("./application/use-cases/verificaciones/ActualizarVerificacion");
const ActualizarVerificacionPorSessionIdUseCase = require("./application/use-cases/verificaciones/ActualizarVerificacionPorSessionId");
const ObtenerEstadisticasVerificacionesUseCase = require("./application/use-cases/verificaciones/ObtenerEstadisticasVerificaciones");

// USE CASES - PLANTILLAS
const ListarPlantillasUseCase = require("./application/use-cases/plantillas/ListarPlantillas");
const ObtenerPlantillaUseCase = require("./application/use-cases/plantillas/ObtenerPlantilla");
const DescargarPlantillaUseCase = require("./application/use-cases/plantillas/DescargarPlantilla");
const SubirPlantillaUseCase = require("./application/use-cases/plantillas/SubirPlantilla");
const ActualizarPlantillaUseCase = require("./application/use-cases/plantillas/ActualizarPlantilla");
const EliminarPlantillaUseCase = require("./application/use-cases/plantillas/EliminarPlantilla");
const ActivarPlantillaUseCase = require("./application/use-cases/plantillas/ActivarPlantilla");
const ObtenerEstadisticasPlantillasUseCase = require("./application/use-cases/plantillas/ObtenerEstadisticasPlantillas");
const BuscarPlantillasUseCase = require("./application/use-cases/plantillas/BuscarPlantillas");

// USE CASES - REACTIVACIÓN
const SolicitarReactivacionCuentaUseCase = require("./application/use-cases/reactivacion/SolicitarReactivacionCuenta");
const ReactivarCuentaUseCase = require("./application/use-cases/reactivacion/ReactivarCuenta");
const ProcesarRecuperacionCuentaUseCase = require("./application/use-cases/reactivacion/ProcesarRecuperacionCuenta");

// USE CASES - TRANSFERENCIAS 
const VerificarHabilitacionTransferenciaUseCase = require("./application/use-cases/transferencias/VerificarHabilitacionTransferencia");
const CrearTransferenciaUseCase = require("./application/use-cases/transferencias/CrearTransferencia");
const ObtenerComprobanteUseCase = require("./application/use-cases/transferencias/ObtenerComprobante");
const ObtenerHistorialTransferenciasUseCase = require("./application/use-cases/transferencias/ObtenerHistorialTransferencias");
const ObtenerMisTransferenciasUseCase = require("./application/use-cases/transferencias/ObtenerMisTransferencias");
const ForzarActualizacionEstadoUseCase = require("./application/use-cases/transferencias/ForzarActualizacionEstado");
const ObtenerEstadisticasTransferenciasUseCase = require("./application/use-cases/transferencias/ObtenerEstadisticasTransferencias");
const SimularProcesamientoTransferenciaUseCase = require("./application/use-cases/transferencias/SimularProcesamientoTransferencia");
const GenerarComprobantePDFUseCase = require("./application/use-cases/transferencias/GenerarComprobantePDF");

// USE CASES - SOLICITUDES 
const CrearSolicitudUseCase = require("./application/use-cases/solicitudes/CrearSolicitud");
const ObtenerMisSolicitudesUseCase = require("./application/use-cases/solicitudes/ObtenerMisSolicitudes");
const ObtenerTodasSolicitudesUseCase = require("./application/use-cases/solicitudes/ObtenerTodasSolicitudes");
const ObtenerSolicitudDetalleUseCase = require("./application/use-cases/solicitudes/ObtenerSolicitudDetalle");
const EnviarSolicitudUseCase = require("./application/use-cases/solicitudes/EnviarSolicitud");
const AprobarSolicitudUseCase = require("./application/use-cases/solicitudes/AprobarSolicitud");
const RechazarSolicitudUseCase = require("./application/use-cases/solicitudes/RechazarSolicitud");
const ObtenerEstadisticasSolicitudesUseCase = require("./application/use-cases/solicitudes/ObtenerEstadisticasSolicitudes");
const SolicitarInformacionAdicionalUseCase = require("./application/use-cases/solicitudes/SolicitarInformacionAdicional");
const IniciarVerificacionKYCUseCase = require("./application/use-cases/solicitudes/IniciarVerificacionKYC");
const AsignarOperadorAutomaticoUseCase = require("./application/use-cases/solicitudes/AsignarOperadorAutomatico");
const EliminarSolicitudUseCase = require("./application/use-cases/solicitudes/EliminarSolicitud");
// CONTROLLERS
const AuthController = require("./interfaces/controllers/AuthController");
const UsuarioController = require("./interfaces/controllers/UsuarioController");
const OperadorController = require("./interfaces/controllers/OperadorController");
const ChatbotController = require("./interfaces/controllers/ChatbotController");
const ComentariosController = require("./interfaces/controllers/ComentariosController");
const ContactosBancariosController = require("./interfaces/controllers/ContactosBancariosController");
const ContratoController = require("./interfaces/controllers/ContratoController");
const DocumentoController = require("./interfaces/controllers/DocumentoController");
const FirmaDigitalController = require("./interfaces/controllers/FirmaDigitalController");
const NotificacionesController = require("./interfaces/controllers/NotificacionesController");
const WebhooksController = require("./interfaces/controllers/WebhooksController");
const VerificacionKYCController = require("./interfaces/controllers/VerificacionKYCController");
const ConfirmacionController = require("./interfaces/controllers/ConfirmacionController");
const PlantillasDocumentoController = require("./interfaces/controllers/PlantillasDocumentosController");
const ReactivacionController = require("./interfaces/controllers/ReactivacionController");
const TransferenciasBancariasController = require("./interfaces/controllers/TransferenciasBancariasController");
const SolicitudesController = require("./interfaces/controllers/SolicitudesController");

// MIDDLEWARE
const AuthMiddleware = require("./interfaces/middleware/auth.middleware");
const uploadMiddleware = require("./interfaces/middleware/upload.middleware");

// CONFIGURACIÓN GLOBAL DE CANVAS
globalThis.Canvas = Canvas;
globalThis.Image = Image;
globalThis.ImageData = ImageData;
globalThis.createCanvas = createCanvas;

const app = express();

// Objeto para almacenar conexiones SSE
const clients = {};

// Headers de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Configurar CORS
app.use(cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Configurar Swagger UI
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Nexia",
  })
);

// Servir archivos estáticos
app.use("/img", express.static(path.join(__dirname, "../frontend/public/img")));

// Ruta de health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor funcionando",
    database: "Supabase PostgreSQL",
    timestamp: new Date().toISOString(),
  });
});

// Configurar SSE para notificaciones
app.get('/api/notificaciones/stream', async (req, res) => {
  const token = req.query.token;
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }

  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }

    const userId = user.id;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Agregar cliente
    const clientId = Date.now();
    clients[userId] = clients[userId] || [];
    clients[userId].push({ id: clientId, res });

    // Enviar ping cada 30 segundos
    const pingInterval = setInterval(() => {
      res.write('data: {"type": "ping"}\n\n');
    }, 30000);

    // Limpiar al cerrar
    req.on('close', () => {
      clearInterval(pingInterval);
      if (clients[userId]) {
        clients[userId] = clients[userId].filter(client => client.id !== clientId);
      }
    });

  } catch (error) {
    console.error('Error en SSE:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// Función para enviar notificación en tiempo real
function enviarNotificacionTiempoReal(userId, notificacion) {
  if (clients[userId]) {
    clients[userId].forEach(client => {
      client.res.write(`data: ${JSON.stringify(notificacion)}\n\n`);
    });
  }
}

// INICIALIZAR SERVIDOR
const iniciarServidor = async () => {
  try {

    // Verificar conexión
    const conexionExitosa = await verificarConexion();

    if (!conexionExitosa) {
      throw new Error("No se pudo conectar a Supabase");
    }
    await configurarStorage();

    // INSTANCIAR REPOSITORIOS
    const usuarioRepository = new SupabaseUsuarioRepository(supabaseClient, supabaseAdmin);
    const solicitanteRepository = new SupabaseSolicitanteRepository(supabaseClient);
    const operadorRepository = new SupabaseOperadorRepository(supabaseClient);
    const intentoLoginRepository = new SupabaseIntentoLoginRepository(supabaseClient);
    const solicitudRepository = new SupabaseSolicitudRepository(supabaseClient, supabaseAdmin);
    const documentoRepository = new SupabaseDocumentoRepository(supabaseClient, supabaseAdmin);
    const notificacionRepository = new SupabaseNotificacionRepository(supabaseClient, supabaseAdmin);
    const plantillaDocumentoRepository = new SupabasePlantillaDocumentoRepository(supabaseClient, supabaseAdmin);
    const reactivacionCuentaRepository = new SupabaseReactivacionCuentaRepository(supabaseClient);
    const chatbotRepository = new SupabaseChatbotRepository(supabaseClient);
    const comentarioRepository = new SupabaseComentarioRepository(supabaseClient);
    const contactoBancarioRepository = new SupabaseContactoBancarioRepository(supabaseClient);
    const contratoRepository = new SupabaseContratoRepository(supabaseClient, supabaseAdmin);
    const firmaDigitalRepository = new SupabaseFirmaDigitalRepository(supabaseClient);
    const verificacionKYCRepository = new SupabaseVerificacionKYCRepository(supabaseClient);
    const transferenciaRepository = new SupabaseTransferenciaBancariaRepository(supabaseClient);
    const solicitudInformacionRepository = new SupabaseSolicitudInformacionRepository(supabaseClient);

    // INSTANCIAR SERVICIOS
    const authService = new AuthService(supabaseClient, supabaseAdmin);
    const notificacionEmailService = new NotificacionEmailService(EmailService);
    const notificacionService = new NotificacionService(notificacionRepository, enviarNotificacionTiempoReal);
    
    // INSTANCIAR USE CASES - AUTH
    const loginUsuario = new LoginUsuarioUseCase(usuarioRepository, intentoLoginRepository, authService);
    const registrarUsuario = new RegistrarUsuarioUseCase(usuarioRepository, solicitanteRepository, operadorRepository, authService, EmailService);
    const refrescarToken = new RefrescarTokenUseCase(authService);
    const cerrarSesion = new CerrarSesionUseCase(authService);
    const obtenerSesion = new ObtenerSesionUseCase(usuarioRepository, authService);

    // INSTANCIAR USE CASES - USUARIO
const obtenerPerfil = new ObtenerPerfilUseCase(usuarioRepository, solicitanteRepository, operadorRepository);
const obtenerPerfilPorId = new ObtenerPerfilPorIdUseCase(usuarioRepository);
const obtenerPerfilUsuario = new ObtenerPerfilUsuarioUseCase(usuarioRepository);
const actualizarPerfil = new ActualizarPerfilUseCase(usuarioRepository, solicitanteRepository);
const actualizarPerfilPorId = new ActualizarPerfilPorIdUseCase(usuarioRepository);
const cambiarContrasena = new CambiarContrasenaUseCase(usuarioRepository, authService, supabaseClient);
const recuperarContrasena = new RecuperarContrasenaUseCase(usuarioRepository, authService, supabaseClient, intentoLoginRepository);
const solicitarRecuperacionCuenta = new SolicitarRecuperacionCuentaUseCase(usuarioRepository, EmailService, authService);
const desactivarCuenta = new DesactivarCuentaUseCase(usuarioRepository, authService);
const actualizarEmailRecuperacion = new ActualizarEmailRecuperacionUseCase(usuarioRepository);
const verificarEstadoCuenta = new VerificarEstadoCuentaUseCase(usuarioRepository);
const obtenerConfiguracionCuenta = new ObtenerConfiguracionCuentaUseCase(usuarioRepository);
const eliminarCuenta = new EliminarCuentaUseCase(usuarioRepository, authService, supabaseClient);
const gestionUsuarios = new GestionUsuariosUseCase(usuarioRepository);

    // INSTANCIAR USE CASES - OPERADOR
    const obtenerDashboard = new ObtenerDashboardUseCase(solicitudRepository);
    const iniciarRevisionSolicitud = new IniciarRevisionSolicitudUseCase(solicitudRepository, BCRAService, supabaseClient);
    const validarDocumentoOperador = new ValidarDocumentoOperadorUseCase(solicitudRepository, supabaseClient);

    // INSTANCIAR USE CASES - CHATBOT
    const procesarMensaje = new ProcesarMensajeUseCase(chatbotRepository, GeminiService);
    const obtenerHistorialChatbot = new ObtenerHistorialChatbotUseCase(chatbotRepository);
    const buscarEnHistorialChatbot = new BuscarEnHistorialChatbotUseCase(chatbotRepository);
    const obtenerEstadisticasChatbot = new ObtenerEstadisticasChatbotUseCase(chatbotRepository);
    const eliminarHistorialChatbot = new EliminarHistorialChatbotUseCase(chatbotRepository);
    const healthCheckChatbot = new HealthCheckChatbotUseCase(chatbotRepository);

    // INSTANCIAR USE CASES - COMENTARIOS
    const crearComentario = new CrearComentarioUseCase(comentarioRepository, NotificacionService, supabaseClient);
    const obtenerComentariosSolicitud = new ObtenerComentariosSolicitudUseCase(comentarioRepository);
    const obtenerContadorNoLeidos = new ObtenerContadorNoLeidosUseCase(comentarioRepository);
    const eliminarComentario = new EliminarComentarioUseCase(comentarioRepository);
    const obtenerEstadisticasComentarios = new ObtenerEstadisticasComentariosUseCase(comentarioRepository);
    const buscarComentarios = new BuscarComentariosUseCase(comentarioRepository);

    // INSTANCIAR USE CASES - CONTACTOS BANCARIOS
    const obtenerContactosOperador = new ObtenerContactosOperadorUseCase(contactoBancarioRepository);
    const buscarContactosPorNumeroCuenta = new BuscarContactosPorNumeroCuentaUseCase(contactoBancarioRepository);
    const obtenerTodosContactos = new ObtenerTodosContactosUseCase(contactoBancarioRepository);
    const crearContactoBancario = new CrearContactoBancarioUseCase(contactoBancarioRepository);
    const obtenerMisContactos = new ObtenerMisContactosUseCase(contactoBancarioRepository);
    const editarContactoBancario = new EditarContactoBancarioUseCase(contactoBancarioRepository);
    const eliminarContactoBancario = new EliminarContactoBancarioUseCase(contactoBancarioRepository);
    const obtenerEstadisticasContactos = new ObtenerEstadisticasContactosUseCase(contactoBancarioRepository);

    // INSTANCIAR USE CASES - CONTRATOS
    const generarContratoParaSolicitud = new GenerarContratoParaSolicitudUseCase(contratoRepository, WordService, supabaseAdmin);
    const verificarEstadoContrato = new VerificarEstadoContratoUseCase(contratoRepository);
    const obtenerContenidoContrato = new ObtenerContenidoContratoUseCase(contratoRepository, supabaseClient);
    const obtenerContratosUsuario = new ObtenerContratosUsuarioUseCase(contratoRepository);
    const obtenerEstadisticasContratos = new ObtenerEstadisticasContratosUseCase(contratoRepository);

    // INSTANCIAR USE CASES - DOCUMENTOS
    const subirDocumento = new SubirDocumentoUseCase(documentoRepository, DiditService);
    const obtenerDocumentosSolicitud = new ObtenerDocumentosSolicitudUseCase(documentoRepository);
    const validarDocumento = new ValidarDocumentoUseCase(documentoRepository);
    const descargarDocumento = new DescargarDocumentoUseCase(documentoRepository);
    const actualizarDocumento = new ActualizarDocumentoUseCase(documentoRepository, DiditService);
    const eliminarDocumento = new EliminarDocumentoUseCase(documentoRepository);
    const evaluarDocumento = new EvaluarDocumentoUseCase(documentoRepository, supabaseClient, NotificacionService);
    const obtenerHistorialEvaluaciones = new ObtenerHistorialEvaluacionesUseCase(documentoRepository);
    const obtenerDocumentosContrato = new ObtenerDocumentosContratoUseCase(supabaseClient);
    const listarDocumentosStorage = new ListarDocumentosStorageUseCase(supabaseClient);
    const obtenerComprobantesTransferencia = new ObtenerComprobantesTransferenciaUseCase(supabaseClient);
    const descargarContrato = new DescargarContratoUseCase(supabaseClient);
    const descargarComprobante = new DescargarComprobanteUseCase(supabaseClient);
    const verDocumento = new VerDocumentoUseCase(supabaseClient);
    const obtenerMisSolicitudesConDocumentos = new ObtenerMisSolicitudesConDocumentosUseCase(supabaseClient);
    const obtenerTodosLosDocumentos = new ObtenerTodosLosDocumentosUseCase(supabaseClient);

    // INSTANCIAR USE CASES - SOLICITUDES
    const crearSolicitud = new CrearSolicitudUseCase(solicitudRepository);
    const obtenerMisSolicitudes = new ObtenerMisSolicitudesUseCase(solicitudRepository);
    const obtenerTodasSolicitudes = new ObtenerTodasSolicitudesUseCase(solicitudRepository);
    const obtenerSolicitudDetalle = new ObtenerSolicitudDetalleUseCase(solicitudRepository, documentoRepository, verificacionKYCRepository);
    const enviarSolicitud = new EnviarSolicitudUseCase(solicitudRepository, documentoRepository, notificacionService, supabaseClient);
    const aprobarSolicitud = new AprobarSolicitudUseCase(solicitudRepository, notificacionService, generarContratoParaSolicitud );
    const rechazarSolicitud = new RechazarSolicitudUseCase(solicitudRepository);
    const obtenerEstadisticasSolicitudes = new ObtenerEstadisticasSolicitudesUseCase(solicitudRepository);
    const solicitarInformacionAdicional = new SolicitarInformacionAdicionalUseCase(solicitudRepository, solicitudInformacionRepository);
    const iniciarVerificacionKYC = new IniciarVerificacionKYCUseCase(solicitudRepository, verificacionKYCRepository, DiditService, supabaseClient);
    const asignarOperadorAutomatico = new AsignarOperadorAutomaticoUseCase(solicitudRepository, supabaseClient);
    const eliminarSolicitud = new EliminarSolicitudUseCase(solicitudRepository, supabaseClient);

    // INSTANCIAR USE CASES - NOTIFICACIONES
    const obtenerNotificaciones = new ObtenerNotificacionesUseCase(notificacionRepository);
    const obtenerContadorNoLeidas = new ObtenerContadorNoLeidasUseCase(notificacionRepository);
    const marcarComoLeida = new MarcarComoLeidaUseCase(notificacionRepository);
    const marcarTodasComoLeidas = new MarcarTodasComoLeidasUseCase(notificacionRepository);
const notificarFirmaSolicitanteCompletada = new NotificarFirmaSolicitanteCompletada(
    notificacionRepository, 
    supabaseClient
);
const notificarFirmaOperadorCompletada = new NotificarFirmaOperadorCompletada(
    notificacionRepository, 
    supabaseClient
);
const notificarFirmaCompletada = new NotificarFirmaCompletada(
    notificacionRepository, 
    supabaseClient
);
    // INSTANCIAR USE CASES - FIRMAS DIGITALES
    const iniciarProcesoFirma = new IniciarProcesoFirmaUseCase(firmaDigitalRepository, contratoRepository, WordService, NotificacionService, supabaseAdmin);
    const obtenerInfoFirma = new ObtenerInfoFirmaUseCase(firmaDigitalRepository, supabaseClient);
const procesarFirma = new ProcesarFirmaUseCase(
    firmaDigitalRepository, 
    WordService, 
    notificacionService,
    notificarFirmaSolicitanteCompletada,
    notificarFirmaOperadorCompletada,
    notificarFirmaCompletada
);
    const descargarDocumentoFirmado = new DescargarDocumentoFirmadoUseCase(firmaDigitalRepository, supabaseClient);
    const obtenerFirmasPendientes = new ObtenerFirmasPendientesUseCase(firmaDigitalRepository);
    const obtenerAuditoriaFirma = new ObtenerAuditoriaFirmaUseCase(firmaDigitalRepository);
    const obtenerEstadisticasFirmas = new ObtenerEstadisticasFirmasUseCase(firmaDigitalRepository);
    const renovarFirmaExpirada = new RenovarFirmaExpiradaUseCase(firmaDigitalRepository);
    const repararRelacionFirmaContrato = new RepararRelacionFirmaContratoUseCase(firmaDigitalRepository);
    const verificarFirmaExistente = new VerificarFirmaExistenteUseCase(firmaDigitalRepository);
    const reiniciarProcesoFirma = new ReiniciarProcesoFirmaUseCase(firmaDigitalRepository);

    // INSTANCIAR USE CASES - WEBHOOKS
    const procesarWebhookDidit = new ProcesarWebhookDiditUseCase(verificacionKYCRepository, documentoRepository, DiditService);

    // INSTANCIAR USE CASES - VERIFICACIONES KYC
    const crearVerificacionKYC = new CrearVerificacionKYCUseCase(verificacionKYCRepository);
    const obtenerVerificacionPorId = new ObtenerVerificacionPorIdUseCase(verificacionKYCRepository);
    const obtenerVerificacionesPorSolicitud = new ObtenerVerificacionesPorSolicitudUseCase(verificacionKYCRepository);
    const obtenerVerificacionPorSessionId = new ObtenerVerificacionPorSessionIdUseCase(verificacionKYCRepository);
    const actualizarVerificacion = new ActualizarVerificacionUseCase(verificacionKYCRepository);
    const actualizarVerificacionPorSessionId = new ActualizarVerificacionPorSessionIdUseCase(verificacionKYCRepository);
    const obtenerEstadisticasVerificaciones = new ObtenerEstadisticasVerificacionesUseCase(verificacionKYCRepository);

    // INSTANCIAR USE CASES - PLANTILLAS
    const listarPlantillas = new ListarPlantillasUseCase(plantillaDocumentoRepository);
    const obtenerPlantilla = new ObtenerPlantillaUseCase(plantillaDocumentoRepository);
    const descargarPlantilla = new DescargarPlantillaUseCase(plantillaDocumentoRepository);
    const subirPlantilla = new SubirPlantillaUseCase(plantillaDocumentoRepository);
    const actualizarPlantilla = new ActualizarPlantillaUseCase(plantillaDocumentoRepository);
    const eliminarPlantilla = new EliminarPlantillaUseCase(plantillaDocumentoRepository);
    const activarPlantilla = new ActivarPlantillaUseCase(plantillaDocumentoRepository);
    const obtenerEstadisticasPlantillas = new ObtenerEstadisticasPlantillasUseCase(plantillaDocumentoRepository);
    const buscarPlantillas = new BuscarPlantillasUseCase(plantillaDocumentoRepository);

    // INSTANCIAR USE CASES - REACTIVACIÓN
    const solicitarReactivacionCuenta = new SolicitarReactivacionCuentaUseCase(usuarioRepository, reactivacionCuentaRepository, EmailService);
    const reactivarCuenta = new ReactivarCuentaUseCase(usuarioRepository, authService);
    const procesarRecuperacionCuenta = new ProcesarRecuperacionCuentaUseCase(usuarioRepository, supabaseAdmin, AuthController);

    // INSTANCIAR USE CASES - TRANSFERENCIAS
    const verificarHabilitacionTransferencia = new VerificarHabilitacionTransferenciaUseCase(transferenciaRepository);
    const crearTransferencia = new CrearTransferenciaUseCase(transferenciaRepository);
    const obtenerComprobante = new ObtenerComprobanteUseCase(transferenciaRepository, supabaseClient);
    const obtenerHistorialTransferencias = new ObtenerHistorialTransferenciasUseCase(transferenciaRepository);
    const obtenerMisTransferencias = new ObtenerMisTransferenciasUseCase(transferenciaRepository);
    const forzarActualizacionEstado = new ForzarActualizacionEstadoUseCase(transferenciaRepository, supabaseClient);
    const obtenerEstadisticasTransferencias = new ObtenerEstadisticasTransferenciasUseCase(transferenciaRepository);
    const simularProcesamientoTransferencia = new SimularProcesamientoTransferenciaUseCase(transferenciaRepository, null, notificacionEmailService, supabaseClient);
    const generarComprobantePDF = new GenerarComprobantePDFUseCase(transferenciaRepository, supabaseClient);

    // INSTANCIAR CONTROLLERS
    const authController = new AuthController(registrarUsuario, loginUsuario, refrescarToken, cerrarSesion, obtenerSesion);

    const confirmacionController = ConfirmacionController;
    
const usuarioController = new UsuarioController(
  obtenerPerfil,
  obtenerPerfilPorId,
  obtenerPerfilUsuario,
  actualizarPerfil,
  actualizarPerfilPorId,
  cambiarContrasena,
  recuperarContrasena,
  solicitarRecuperacionCuenta,
  desactivarCuenta,
  actualizarEmailRecuperacion,
  verificarEstadoCuenta,
  obtenerConfiguracionCuenta,
  eliminarCuenta,
  gestionUsuarios
);

    const operadorController = new OperadorController(
      obtenerDashboard,
      iniciarRevisionSolicitud,
      validarDocumentoOperador
    );

    const chatbotController = new ChatbotController(
      procesarMensaje,
      obtenerHistorialChatbot,
      buscarEnHistorialChatbot,
      obtenerEstadisticasChatbot,
      eliminarHistorialChatbot,
      healthCheckChatbot
    );
    
    const comentariosController = new ComentariosController(
      crearComentario,
      obtenerComentariosSolicitud,
      obtenerContadorNoLeidos,
      eliminarComentario,
      obtenerEstadisticasComentarios,
      buscarComentarios
    );

    const contactosBancariosController = new ContactosBancariosController(
      obtenerContactosOperador,
      buscarContactosPorNumeroCuenta,
      obtenerTodosContactos,
      crearContactoBancario,
      obtenerMisContactos,
      editarContactoBancario,
      eliminarContactoBancario,
      obtenerEstadisticasContactos
    );

    const contratoController = new ContratoController(
      generarContratoParaSolicitud,
      verificarEstadoContrato,
      obtenerContenidoContrato,
      obtenerContratosUsuario,
      obtenerEstadisticasContratos,
      supabaseClient
    );

    const documentoController = new DocumentoController(
      subirDocumento,
      obtenerDocumentosSolicitud,
      validarDocumento,
      descargarDocumento,
      actualizarDocumento,
      eliminarDocumento,
      evaluarDocumento,
      obtenerHistorialEvaluaciones,
      obtenerDocumentosContrato,
      listarDocumentosStorage,
      obtenerComprobantesTransferencia,
      descargarContrato,
      descargarComprobante,
      verDocumento,
      obtenerMisSolicitudesConDocumentos,
      obtenerTodosLosDocumentos,
      supabaseClient
    );

    const firmaDigitalController = new FirmaDigitalController(
      iniciarProcesoFirma,
      obtenerInfoFirma,
      procesarFirma,
      descargarDocumentoFirmado,
      obtenerFirmasPendientes,
      obtenerAuditoriaFirma,
      obtenerEstadisticasFirmas,
      renovarFirmaExpirada,
      repararRelacionFirmaContrato,
      verificarFirmaExistente,
      reiniciarProcesoFirma,
      supabaseClient
    );

    const notificacionesController = new NotificacionesController(
      obtenerNotificaciones,
      obtenerContadorNoLeidas,
      marcarComoLeida,
      marcarTodasComoLeidas
    );
    
    const webhooksController = new WebhooksController(procesarWebhookDidit);
    
    const verificacionKYCController = new VerificacionKYCController(
      crearVerificacionKYC,
      obtenerVerificacionPorId,
      obtenerVerificacionesPorSolicitud,
      obtenerVerificacionPorSessionId,
      actualizarVerificacion,
      actualizarVerificacionPorSessionId,
      obtenerEstadisticasVerificaciones
    );

    const plantillasDocumentoController = new PlantillasDocumentoController(
      listarPlantillas,
      obtenerPlantilla,
      descargarPlantilla,
      subirPlantilla,
      actualizarPlantilla,
      eliminarPlantilla,
      activarPlantilla,
      obtenerEstadisticasPlantillas,
      buscarPlantillas
    );

    const reactivacionController = new ReactivacionController(
      solicitarReactivacionCuenta,
      reactivarCuenta,
      procesarRecuperacionCuenta
    );
    
    const transferenciasBancariasController = new TransferenciasBancariasController(
      verificarHabilitacionTransferencia,
      crearTransferencia,
      obtenerComprobante,
      obtenerHistorialTransferencias,
      obtenerMisTransferencias,
      forzarActualizacionEstado,
      obtenerEstadisticasTransferencias,
      simularProcesamientoTransferencia,
      generarComprobantePDF,
      supabaseClient
    );

    const solicitudesController = new SolicitudesController(
      crearSolicitud,
      obtenerMisSolicitudes,
      obtenerTodasSolicitudes,
      obtenerSolicitudDetalle,
      enviarSolicitud,
      aprobarSolicitud,
      rechazarSolicitud,
      obtenerEstadisticasSolicitudes,
      solicitarInformacionAdicional,
      iniciarVerificacionKYC,
      asignarOperadorAutomatico,
      eliminarSolicitud
    );

    const inspectController = (name, controller) => {
      console.log(`\nController: ${name}`);
      try {
        // Verificar si es una clase con métodos estáticos
        if (controller && typeof controller === 'function' && controller.prototype) {
          console.log(` ${name} es una clase con métodos estáticos`);
          const staticMethods = Object.getOwnPropertyNames(controller)
            .filter(p => p !== 'prototype' && p !== 'length' && p !== 'name' && typeof controller[p] === 'function');
          staticMethods.forEach(m => console.log(` ${name}.${m} (estático)`));
          return;
        }
        
        const props = Object.getOwnPropertyNames(Object.getPrototypeOf(controller));
        props.forEach((p) => {
          if (p === "constructor") return;
          const type = typeof controller[p];
          if (type !== "function") {
            console.error(` ${name}.${p} NO es función ->`, type);
          } else {
            console.log(` ${name}.${p}`);
          }
        });
      } catch (error) {
        console.log(` ${name} es una clase con métodos estáticos (no se inspecciona)`);
      }
    };

    const controllers = {
      authController,
      usuarioController,
      operadorController,
      chatbotController,
      comentariosController,
      contactosBancariosController,
      contratoController,
      documentoController,
      firmaDigitalController,
      notificacionesController,
      webhooksController,
      verificacionKYCController,
      plantillasDocumentoController,
      reactivacionController,
      transferenciasBancariasController,
      solicitudesController
    };


    // INSTANCIAR MIDDLEWARE
    const authMiddleware = new AuthMiddleware();

    // VERIFICAR TODOS LOS CONTROLADORES ANTES DE PASARLOS A ROUTES
    console.log('\n VERIFICANDO CONTROLADORES ANTES DE PASARLOS A ROUTES:');
    const controllersToCheck = {
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
      solicitudesController
    };

    for (const [name, controller] of Object.entries(controllersToCheck)) {
      if (!controller) {
        console.error(` ${name} es undefined`);
        process.exit(1);
      }
      if (typeof controller === 'function' && controller.prototype) {
        console.log(` ${name} es una clase (métodos estáticos)`);
      } else if (typeof controller === 'object') {
        console.log(` ${name} es un objeto instanciado`);
        // Verificar algunos métodos
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(controller))
          .filter(p => p !== 'constructor');
        if (methods.length > 0) {
          console.log(`   Métodos: ${methods.slice(0, 3).join(', ')}...`);
        }
      } else {
        console.error(` ${name} tiene tipo inesperado: ${typeof controller}`);
        process.exit(1);
      }
    }

    console.log('\n Todos los controladores son válidos. Creando rutas...\n');

    // CONFIGURAR RUTAS - CON TRY/CATCH
    let routes;
    try {
      console.log(' Llamando a require("./interfaces/routes")...');
      const routesFactory = require('./interfaces/routes');
      console.log(' routesFactory cargado');
      
      console.log(' Ejecutando routesFactory con dependencias...');
      routes = routesFactory({
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
        emailValidator,
        solicitudesController
      });
      console.log(' routesFactory ejecutado correctamente');
      
      // Verificar que routes sea un router de Express
      if (!routes || typeof routes !== 'function' || !routes.stack) {
        console.error(' routes NO es un router de Express válido:', {
          type: typeof routes,
          hasStack: routes && !!routes.stack,
          isFunction: typeof routes === 'function'
        });
        process.exit(1);
      }
      console.log(` routes es un router de Express con ${routes.stack.length} rutas en stack principal`);
      
    } catch (error) {
      console.error(' Error al crear routes:', error);
      console.error(error.stack);
      process.exit(1);
    }

    // ------------------ VERIFICACIÓN DETALLADA DE ROUTERS ------------------
    console.log('\n VERIFICACIÓN DETALLADA DE ROUTERS ANTES DE MONTAR');
    
    // Ahora necesitamos obtener los routers individuales para verificarlos
    // Vamos a inspeccionar el stack de routes para extraerlos
    if (routes && routes.stack) {
      routes.stack.forEach((layer, index) => {
        if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          const routerName = `router_${index}`;
          console.log(`\n Verificando sub-router [${index}]:`);
          console.log(`   Path: ${layer.regexp}`);
          console.log(`   Stack size: ${layer.handle.stack.length}`);
          
          // Verificar handlers en este sub-router
          layer.handle.stack.forEach((routeLayer, routeIndex) => {
            if (routeLayer.route) {
              const path = routeLayer.route.path;
              const methods = Object.keys(routeLayer.route.methods).join(', ').toUpperCase();
              console.log(`      Ruta ${routeIndex}: ${methods} ${path}`);
              
              routeLayer.route.stack.forEach((handlerLayer, handlerIndex) => {
                const handlerType = typeof handlerLayer.handle;
                if (handlerType !== 'function') {
                  console.error(`          Handler ${handlerIndex} NO es función: ${handlerType}`);
                }
              });
            }
          });
        }
      });
    }

    console.log('\n VERIFICACIÓN COMPLETADA. Montando rutas...\n');

    // Montar rutas
    app.use("/api", routes);

    // Configuración para producción
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "../frontend/build")));
      app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
      });
      const frontendRoutes = ['/login', '/register', '/solicitante', '/operador', '/confirmacion', '/confirmacion-exitosa', '/error'];
      frontendRoutes.forEach(route => {
        app.get(route, (req, res) => {
          res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
        });
      });
      app.use((req, res, next) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({ success: false, message: `Endpoint API no encontrado: ${req.path}` });
        }
        res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
      });
    } else {
      // En desarrollo
      app.use((req, res, next) => {
        if (req.path.startsWith("/api") && !req.path.startsWith("/api-docs")) {
          return res.status(404).json({ success: false, message: `Endpoint API no encontrado: ${req.path}` });
        }
        next();
      });
      app.use((req, res) => {
        if (!req.path.startsWith("/api") && !req.path.startsWith("/api-docs")) {
          return res.status(404).json({
            success: false,
            message: "Ruta no encontrada. En desarrollo, el frontend debe ejecutarse en puerto 3000"
          });
        }
        res.status(404).json({ success: false, message: `Endpoint no encontrado: ${req.path}` });
      });
    }

    // Manejo de errores global
    app.use((err, req, res, next) => {
      console.error('Error del servidor:', err);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    });

    const PORT = process.env.PORT || 3001;

    const server = app.listen(PORT, () => {
      console.log(`\n¡Servidor ejecutándose correctamente!`);
      console.log(`Puerto: ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Documentación API: http://localhost:${PORT}/api-docs`);
      console.log(`\nEndpoints disponibles:`);
      console.log(`   Health:    GET  http://localhost:${PORT}/api/health`);
      console.log(`   API Docs:  GET  http://localhost:${PORT}/api-docs`);
    });

    // Manejo de cierre
    process.on("SIGTERM", () => {
      console.log("Recibido SIGTERM, cerrando servidor...");
      server.close(() => {
        console.log("Servidor cerrado correctamente");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("Recibido SIGINT, cerrando servidor...");
      server.close(() => {
        console.log("Servidor cerrado correctamente");
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("Error crítico iniciando servidor:", error.message);
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("Promise rechazada no manejada:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Excepción no capturada:", error);
  process.exit(1);
});

// Iniciar servidor
iniciarServidor();

module.exports = { enviarNotificacionTiempoReal };