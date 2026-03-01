// backend/application/use-cases/plantillas/EliminarPlantilla.js
const AuditoriaPlantilla = require('../../../domain/entities/AuditoriaPlantilla');

class EliminarPlantilla {
  constructor(plantillaDocumentoRepository) {
    this.plantillaDocumentoRepository = plantillaDocumentoRepository;
  }

  async execute(id, usuario, req) {

    const resultado = await this.plantillaDocumentoRepository.eliminar(id);

    // Registrar auditoría
    const auditoria = new AuditoriaPlantilla({
      plantilla_id: id,
      usuario_id: usuario.id,
      accion: AuditoriaPlantilla.ACCIONES.ELIMINAR_PLANTILLA,
      descripcion: 'Plantilla eliminada del sistema',
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await this.plantillaDocumentoRepository.registrarAuditoria(auditoria.toJSON());

    return {
      success: true,
      message: 'Plantilla eliminada exitosamente',
      data: resultado
    };
  }
}

module.exports = EliminarPlantilla;