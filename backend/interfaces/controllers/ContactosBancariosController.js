// backend/interfaces/controllers/ContactosBancariosController.js
class ContactosBancariosController {
  constructor(
    obtenerContactosOperadorUseCase,
    buscarContactosPorNumeroCuentaUseCase,
    obtenerTodosContactosUseCase,
    crearContactoBancarioUseCase,
    obtenerMisContactosUseCase,
    editarContactoBancarioUseCase,
    eliminarContactoBancarioUseCase,
    obtenerEstadisticasContactosUseCase
  ) {
    this._obtenerContactosOperador = obtenerContactosOperadorUseCase;
    this._buscarContactosPorNumeroCuenta = buscarContactosPorNumeroCuentaUseCase;
    this._obtenerTodosContactos = obtenerTodosContactosUseCase;
    this._crearContactoBancario = crearContactoBancarioUseCase;
    this._obtenerMisContactos = obtenerMisContactosUseCase;
    this._editarContactoBancario = editarContactoBancarioUseCase;
    this._eliminarContactoBancario = eliminarContactoBancarioUseCase;
    this._obtenerEstadisticasContactos = obtenerEstadisticasContactosUseCase;
  }

  async obtenerContactosOperador(req, res) {
    const result = await this._obtenerContactosOperador.execute(req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async buscarContactosPorNumeroCuenta(req, res) {
    const result = await this._buscarContactosPorNumeroCuenta.execute(req.query, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerTodosContactos(req, res) {
    const result = await this._obtenerTodosContactos.execute(req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async crearContacto(req, res) {
    const result = await this._crearContactoBancario.execute(req.body, req.usuario);
    return res.status(result.status || (result.success ? 201 : 500)).json(result);
  }

  async obtenerMisContactos(req, res) {
    const result = await this._obtenerMisContactos.execute(req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async editarContacto(req, res) {
    const { id } = req.params;
    const result = await this._editarContactoBancario.execute(id, req.body, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async eliminarContacto(req, res) {
    const { id } = req.params;
    const result = await this._eliminarContactoBancario.execute(id, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerEstadisticas(req, res) {
    const result = await this._obtenerEstadisticasContactos.execute(req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = ContactosBancariosController;