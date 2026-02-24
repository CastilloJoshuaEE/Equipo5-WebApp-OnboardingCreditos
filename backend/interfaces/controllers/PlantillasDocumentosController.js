// backend/interfaces/controllers/PlantillasDocumentosController.js
class PlantillasDocumentoController {
  constructor(
    listarPlantillasUseCase,
    obtenerPlantillaUseCase,
    descargarPlantillaUseCase,
    subirPlantillaUseCase,
    actualizarPlantillaUseCase,
    eliminarPlantillaUseCase,
    activarPlantillaUseCase,
    obtenerEstadisticasUseCase,
    buscarPlantillasUseCase
  ) {
    this._listarPlantillas = listarPlantillasUseCase;
    this._obtenerPlantilla = obtenerPlantillaUseCase;
    this._descargarPlantilla = descargarPlantillaUseCase;
    this._subirPlantilla = subirPlantillaUseCase;
    this._actualizarPlantilla = actualizarPlantillaUseCase;
    this._eliminarPlantilla = eliminarPlantillaUseCase;
    this._activarPlantilla = activarPlantillaUseCase;
    this._obtenerEstadisticas = obtenerEstadisticasUseCase;
    this._buscarPlantillas = buscarPlantillasUseCase;
  }

  async listar(req, res) {
    const result = await this._listarPlantillas.execute();
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtener(req, res) {
    const { id } = req.params;
    const result = await this._obtenerPlantilla.execute(id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async descargar(req, res) {
    const { id } = req.params;
    const result = await this._descargarPlantilla.execute(id);

    if (!result.success) {
      return res.status(result.status || 500).json(result);
    }

    res.setHeader('Content-Type', result.data.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.nombre_archivo}"`);
    res.send(result.data.buffer);
  }

  async subir(req, res) {
    const archivo = req.file;
    const { tipo } = req.body;
    const usuario = req.usuario;

    const result = await this._subirPlantilla.execute(archivo, tipo, usuario, req);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async actualizar(req, res) {
    const { id } = req.params;
    const archivo = req.file;
    const usuario = req.usuario;

    const result = await this._actualizarPlantilla.execute(id, archivo, usuario, req);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async eliminar(req, res) {
    const { id } = req.params;
    const usuario = req.usuario;

    const result = await this._eliminarPlantilla.execute(id, usuario, req);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async activar(req, res) {
    const { id } = req.params;
    const usuario = req.usuario;

    const result = await this._activarPlantilla.execute(id, usuario, req);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerEstadisticas(req, res) {
    const result = await this._obtenerEstadisticas.execute();
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async buscar(req, res) {
    const { q } = req.query;
    const result = await this._buscarPlantillas.execute(q);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = PlantillasDocumentoController;