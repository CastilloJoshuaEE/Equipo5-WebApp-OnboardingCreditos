// backend/interfaces/controllers/OperadorController.js
class OperadorController {
  constructor(
    obtenerDashboardUseCase,
    iniciarRevisionSolicitudUseCase,
    validarDocumentoUseCase
  ) {
    this._obtenerDashboard = obtenerDashboardUseCase;
    this._iniciarRevisionSolicitud = iniciarRevisionSolicitudUseCase;
    this._validarDocumento = validarDocumentoUseCase;
  }

  async obtenerDashboard(req, res) {
    const operadorId = req.usuario.id;
    const result = await this._obtenerDashboard.execute(operadorId, req.query);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async iniciarRevision(req, res) {
    const { solicitud_id } = req.params;
    const operadorId = req.usuario.id;
    const result = await this._iniciarRevisionSolicitud.execute(solicitud_id, operadorId);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async validarDocumento(req, res) {
    const { solicitud_id, documento_id } = req.params;
    const operadorId = req.usuario.id;
    const result = await this._validarDocumento.execute(
      solicitud_id,
      documento_id,
      operadorId,
      req.body
    );
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = OperadorController;