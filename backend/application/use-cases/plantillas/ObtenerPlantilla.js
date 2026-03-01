// backend/application/use-cases/plantillas/ObtenerPlantilla.js
class ObtenerPlantilla {
  constructor(plantillaDocumentoRepository) {
    this.plantillaDocumentoRepository = plantillaDocumentoRepository;
  }

  async execute(id) {
    const plantilla = await this.plantillaDocumentoRepository.obtenerPorId(id);

    if (!plantilla) {
      return {
        success: false,
        status: 404,
        message: 'Plantilla no encontrada'
      };
    }

    return {
      success: true,
      data: plantilla
    };
  }
}

module.exports = ObtenerPlantilla;