// backend/application/use-cases/plantillas/DescargarPlantilla.js
class DescargarPlantilla {
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

    const fileData = await this.plantillaDocumentoRepository.descargarArchivo(plantilla.ruta_storage);
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      success: true,
      data: {
        buffer,
        nombre_archivo: plantilla.nombre_archivo,
        content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        plantilla
      }
    };
  }
}

module.exports = DescargarPlantilla;