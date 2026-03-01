// backend/application/use-cases/plantillas/ObtenerEstadisticasPlantillas.js
class ObtenerEstadisticasPlantillas {
  constructor(plantillaDocumentoRepository) {
    this.plantillaDocumentoRepository = plantillaDocumentoRepository;
  }

  async execute() {
    const estadisticas = await this.plantillaDocumentoRepository.obtenerEstadisticas();

    return {
      success: true,
      data: estadisticas
    };
  }
}

module.exports = ObtenerEstadisticasPlantillas;