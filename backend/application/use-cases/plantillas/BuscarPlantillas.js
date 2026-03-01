// backend/application/use-cases/plantillas/BuscarPlantillas.js
class BuscarPlantillas {
  constructor(plantillaDocumentoRepository) {
    this.plantillaDocumentoRepository = plantillaDocumentoRepository;
  }

  async execute(termino) {
    if (!termino) {
      return {
        success: false,
        status: 400,
        message: 'Término de búsqueda requerido'
      };
    }

    const resultados = await this.plantillaDocumentoRepository.buscar(termino);

    return {
      success: true,
      data: resultados
    };
  }
}

module.exports = BuscarPlantillas;