// backend/application/use-cases/plantillas/ActivarPlantilla.js
const AuditoriaPlantilla = require('../../../domain/entities/AuditoriaPlantilla');

class ActivarPlantilla {
  constructor(plantillaDocumentoRepository) {
    this.plantillaDocumentoRepository = plantillaDocumentoRepository;
  }

  async execute(id, usuario, req) {

    const plantilla = await this.plantillaDocumentoRepository.obtenerPorId(id);
    if (!plantilla) {
      return {
        success: false,
        status: 404,
        message: 'Plantilla no encontrada'
      };
    }

    const plantillaActivada = await this.plantillaDocumentoRepository.marcarComoActiva(id, plantilla.tipo);

    // Registrar auditoría
    const auditoria = new AuditoriaPlantilla({
      plantilla_id: id,
      usuario_id: usuario.id,
      accion: AuditoriaPlantilla.ACCIONES.ACTIVAR_PLANTILLA,
      descripcion: `Plantilla marcada como activa para tipo: ${plantilla.tipo}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await this.plantillaDocumentoRepository.registrarAuditoria(auditoria.toJSON());

    return {
      success: true,
      message: 'Plantilla activada exitosamente',
      data: plantillaActivada
    };
  }
}

module.exports = ActivarPlantilla;