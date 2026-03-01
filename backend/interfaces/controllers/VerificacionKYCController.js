// backend/interfaces/controllers/VerificacionKYCController.js
class VerificacionKYCController {
  constructor(
    crearVerificacionUseCase,
    obtenerVerificacionPorIdUseCase,
    obtenerVerificacionesPorSolicitudUseCase,
    obtenerVerificacionPorSessionIdUseCase,
    actualizarVerificacionUseCase,
    actualizarVerificacionPorSessionIdUseCase,
    obtenerEstadisticasVerificacionesUseCase
  ) {
    this.crearVerificacion = crearVerificacionUseCase;
    this.obtenerVerificacionPorId = obtenerVerificacionPorIdUseCase;
    this.obtenerVerificacionesPorSolicitud = obtenerVerificacionesPorSolicitudUseCase;
    this.obtenerVerificacionPorSessionId = obtenerVerificacionPorSessionIdUseCase;
    this.actualizarVerificacion = actualizarVerificacionUseCase;
    this.actualizarVerificacionPorSessionId = actualizarVerificacionPorSessionIdUseCase;
    this.obtenerEstadisticasVerificaciones = obtenerEstadisticasVerificacionesUseCase;
  }

  async crear(req, res) {
    const result = await this.crearVerificacion.execute(req.body);
    return res.status(result.status || (result.success ? 201 : 500)).json(result);
  }

  async obtenerPorId(req, res) {
    const { id } = req.params;
    const result = await this.obtenerVerificacionPorId.execute(id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerPorSolicitud(req, res) {
    const { solicitud_id } = req.params;
    const result = await this.obtenerVerificacionesPorSolicitud.execute(solicitud_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerPorSessionId(req, res) {
    const { session_id } = req.params;
    const result = await this.obtenerVerificacionPorSessionId.execute(session_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async actualizar(req, res) {
    const { id } = req.params;
    const result = await this.actualizarVerificacion.execute(id, req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async actualizarPorSessionId(req, res) {
    const { session_id } = req.params;
    const result = await this.actualizarVerificacionPorSessionId.execute(session_id, req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerEstadisticas(req, res) {
    const result = await this.obtenerEstadisticasVerificaciones.execute();
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = VerificacionKYCController;