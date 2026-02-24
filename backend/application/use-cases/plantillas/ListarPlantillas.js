// backend/application/use-cases/plantillas/ListarPlantillas.js
class ListarPlantillas {
  constructor(plantillaDocumentoRepository) {
    this.plantillaDocumentoRepository = plantillaDocumentoRepository;
  }

  async execute() {
    const plantillas = await this.plantillaDocumentoRepository.listar();

    return {
      success: true,
      data: plantillas
    };
  }
}

module.exports = ListarPlantillas;