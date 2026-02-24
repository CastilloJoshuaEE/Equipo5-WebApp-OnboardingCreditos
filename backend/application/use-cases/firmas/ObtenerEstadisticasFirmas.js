// backend/application/use-cases/firmas/ObtenerEstadisticasFirmas.js
class ObtenerEstadisticasFirmas {
  constructor(firmaDigitalRepository) {
    this.firmaDigitalRepository = firmaDigitalRepository;
  }

  async execute(usuario) {
    const estadisticas = await this.firmaDigitalRepository.obtenerEstadisticas(
      usuario.id,
      usuario.rol
    );

    return {
      success: true,
      data: estadisticas
    };
  }
}

module.exports = ObtenerEstadisticasFirmas;