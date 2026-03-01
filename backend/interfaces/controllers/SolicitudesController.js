// backend/interfaces/controllers/SolicitudesController.js
class SolicitudesController {
  constructor(
    crearSolicitudUseCase,
    obtenerMisSolicitudesUseCase,
    obtenerTodasSolicitudesUseCase,
    obtenerSolicitudDetalleUseCase,
    enviarSolicitudUseCase,
    aprobarSolicitudUseCase,
    rechazarSolicitudUseCase,
    obtenerEstadisticasUseCase,
    solicitarInformacionAdicionalUseCase,
    iniciarVerificacionKYCUseCase,
    asignarOperadorAutomaticoUseCase,
    eliminarSolicitudUseCase
  ) {
    this._crearSolicitud = crearSolicitudUseCase;
    this._obtenerMisSolicitudes = obtenerMisSolicitudesUseCase;
    this._obtenerTodasSolicitudes = obtenerTodasSolicitudesUseCase;
    this._obtenerSolicitudDetalle = obtenerSolicitudDetalleUseCase;
    this._enviarSolicitud = enviarSolicitudUseCase;
    this._aprobarSolicitud = aprobarSolicitudUseCase;
    this._rechazarSolicitud = rechazarSolicitudUseCase;
    this._obtenerEstadisticas = obtenerEstadisticasUseCase;
    this._solicitarInformacionAdicional = solicitarInformacionAdicionalUseCase;
    this._iniciarVerificacionKYC = iniciarVerificacionKYCUseCase;
    this._asignarOperadorAutomatico = asignarOperadorAutomaticoUseCase;
    this._eliminarSolicitud = eliminarSolicitudUseCase;
  }

  async crearSolicitud(req, res) {
    const result = await this._crearSolicitud.execute(req.body, req.usuario);
    return res.status(result.status || (result.success ? 201 : 500)).json(result);
  }

  async obtenerMisSolicitudes(req, res) {
    const result = await this._obtenerMisSolicitudes.execute(req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerTodasSolicitudes(req, res) {
    const result = await this._obtenerTodasSolicitudes.execute(req.query);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerSolicitudDetalle(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._obtenerSolicitudDetalle.execute(solicitud_id, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async enviarSolicitud(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._enviarSolicitud.execute(solicitud_id, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async aprobarSolicitud(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._aprobarSolicitud.execute(solicitud_id, req.body, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async rechazarSolicitud(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._rechazarSolicitud.execute(solicitud_id, req.body, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerEstadisticas(req, res) {
    const result = await this._obtenerEstadisticas.execute(req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async solicitarInformacionAdicional(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._solicitarInformacionAdicional.execute(solicitud_id, req.body, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async iniciarVerificacionKYC(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._iniciarVerificacionKYC.execute(solicitud_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async asignarOperador(req, res) {
    const { solicitud_id } = req.params;
    const { operador_id } = req.body;

    if (!operador_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de operador es requerido'
      });
    }

    try {
      await this._asignarOperadorAutomatico.execute(solicitud_id);
      res.json({ success: true, message: 'Operador asignado exitosamente' });
    } catch (error) {
      console.error('Error asignando operador:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async calcularNivelRiesgo(req, res) {
    return res.status(501).json({ success: false, message: 'No implementado directamente' });
  }
  async eliminarSolicitud(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._eliminarSolicitud.execute(solicitud_id, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = SolicitudesController;