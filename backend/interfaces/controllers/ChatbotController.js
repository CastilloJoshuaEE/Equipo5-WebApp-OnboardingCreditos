// backend/interfaces/controllers/ChatbotController.js
class ChatbotController {
  constructor(
    procesarMensajeUseCase,
    obtenerHistorialUseCase,
    buscarEnHistorialUseCase,
    obtenerEstadisticasUseCase,
    eliminarHistorialUseCase,
    healthCheckUseCase
  ) {
    this.procesarMensaje = procesarMensajeUseCase;
    this.obtenerHistorial = obtenerHistorialUseCase;
    this.buscarEnHistorial = buscarEnHistorialUseCase;
    this.obtenerEstadisticas = obtenerEstadisticasUseCase;
    this.eliminarHistorial = eliminarHistorialUseCase;
    this.healthCheck = healthCheckUseCase;
  }

  async procesarMensajePublico(req, res) {
    const { mensaje } = req.body;
    const usuario = req.usuario || null;

    const result = await this.procesarMensaje.execute({ mensaje, usuario });
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async procesarMensajeAutenticado(req, res) {
    const { mensaje } = req.body;
    const usuario = req.usuario;

    const result = await this.procesarMensaje.execute({ mensaje, usuario });
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerHistorialUsuario(req, res) {
    const usuarioId = req.usuario.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await this.obtenerHistorial.execute(usuarioId, { limit, offset });
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async buscarEnHistorialUsuario(req, res) {
    const usuarioId = req.usuario.id;
    const { query, limit = 10 } = req.query;

    const result = await this.buscarEnHistorial.execute(usuarioId, { query, limit });
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerEstadisticasUsuario(req, res) {
    const usuarioId = req.usuario.id;

    const result = await this.obtenerEstadisticas.execute(usuarioId);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async eliminarHistorialUsuario(req, res) {
    const usuarioId = req.usuario.id;
    const { interaccionIds } = req.body;

    const result = await this.eliminarHistorial.execute(usuarioId, { interaccionIds });
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async verificarHealth(req, res) {
    const result = await this.healthCheck.execute();
    return res.status(result.status || (result.success ? 200 : 503)).json(result);
  }
}

module.exports = ChatbotController;