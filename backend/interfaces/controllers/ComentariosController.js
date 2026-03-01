// backend/interfaces/controllers/ComentariosController.js
class ComentariosController {
  constructor(
    crearComentarioUseCase,
    obtenerComentariosSolicitudUseCase,
    obtenerContadorNoLeidosUseCase,
    eliminarComentarioUseCase,
    obtenerEstadisticasUseCase,
    buscarComentariosUseCase
  ) {
    this._crearComentario = crearComentarioUseCase;
    this._obtenerComentariosSolicitud = obtenerComentariosSolicitudUseCase;
    this._obtenerContadorNoLeidos = obtenerContadorNoLeidosUseCase;
    this._eliminarComentario = eliminarComentarioUseCase;
    this._obtenerEstadisticas = obtenerEstadisticasUseCase;
    this._buscarComentarios = buscarComentariosUseCase;
  }

  async crear(req, res) {
    const { solicitud_id, comentario, tipo } = req.body;
    const usuario = req.usuario;
    const result = await this._crearComentario.execute(
      { solicitud_id, comentario, tipo },
      usuario
    );
    return res.status(result.status || (result.success ? 201 : 500)).json(result);
  }

  async obtenerPorSolicitud(req, res) {
    const { solicitud_id } = req.params;
    const usuario = req.usuario;
    const { tipo, limit, offset } = req.query;
    const result = await this._obtenerComentariosSolicitud.execute(
      solicitud_id,
      usuario,
      { tipo, limit, offset }
    );
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerContadorNoLeidos(req, res) {
    const usuarioId = req.usuario.id;
    const result = await this._obtenerContadorNoLeidos.execute(usuarioId);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async eliminar(req, res) {
    const { id } = req.params;
    const usuario = req.usuario;
    const result = await this._eliminarComentario.execute(id, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerEstadisticas(req, res) {
    const usuario = req.usuario;
    const result = await this._obtenerEstadisticas.execute(usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async buscar(req, res) {
    const usuario = req.usuario;
    const { q, limit } = req.query;
    const result = await this._buscarComentarios.execute({ q, limit }, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = ComentariosController;