// backend/application/use-cases/verificaciones/ObtenerEstadisticasVerificaciones.js
class ObtenerEstadisticasVerificaciones {
  constructor(verificacionKYCRepository) {
    this.verificacionKYCRepository = verificacionKYCRepository;
  }

  async execute() {
    const estadisticas = await this.verificacionKYCRepository.getEstadisticas();

    return {
      success: true,
      data: estadisticas
    };
  }
}

module.exports = ObtenerEstadisticasVerificaciones;