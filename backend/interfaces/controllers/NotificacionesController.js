// backend/interfaces/controllers/NotificacionesController.js
class NotificacionesController {
  constructor(
    obtenerNotificacionesUseCase,
    obtenerContadorNoLeidasUseCase,
    marcarComoLeidaUseCase,
    marcarTodasComoLeidasUseCase
  ) {
    this._obtenerNotificaciones = obtenerNotificacionesUseCase;
    this._obtenerContadorNoLeidas = obtenerContadorNoLeidasUseCase;
    this._marcarComoLeida = marcarComoLeidaUseCase;
    this._marcarTodasComoLeidas = marcarTodasComoLeidasUseCase;
  }

  async obtenerNotificaciones(req, res) {
    const usuarioId = req.usuario.id;
    const { limit, offset, leida } = req.query;

    const result = await this._obtenerNotificaciones.execute(usuarioId, { limit, offset, leida });
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerContadorNoLeidas(req, res) {
    const usuarioId = req.usuario.id;

    const result = await this._obtenerContadorNoLeidas.execute(usuarioId);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async marcarComoLeida(req, res) {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const result = await this._marcarComoLeida.execute(id, usuarioId);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async marcarTodasComoLeidas(req, res) {
    const usuarioId = req.usuario.id;

    const result = await this._marcarTodasComoLeidas.execute(usuarioId);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = NotificacionesController;