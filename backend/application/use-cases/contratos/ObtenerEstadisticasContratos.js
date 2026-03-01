// backend/application/use-cases/contratos/ObtenerEstadisticasContratos.js
class ObtenerEstadisticasContratos {
  constructor(contratoRepository) {
    this.contratoRepository = contratoRepository;
  }

  async execute(usuarioId, usuarioRol) {
    const estadisticas = await this.contratoRepository.obtenerEstadisticas(usuarioId, usuarioRol);

    return {
      success: true,
      data: estadisticas
    };
  }
}

module.exports = ObtenerEstadisticasContratos;