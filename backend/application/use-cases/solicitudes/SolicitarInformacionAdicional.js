// backend/application/use-cases/solicitudes/SolicitarInformacionAdicional.js
const Solicitud = require('../../../domain/entities/Solicitud');
const SolicitudInformacion = require('../../../domain/entities/SolicitudInformacion');

class SolicitarInformacionAdicional {
  constructor(solicitudRepository, solicitudInformacionRepository) {
    this.solicitudRepository = solicitudRepository;
    this.solicitudInformacionRepository = solicitudInformacionRepository;
  }

  async execute(solicitud_id, { informacion_solicitada, plazo_dias = 7 }, usuario) {
    if (!informacion_solicitada) {
      return {
        success: false,
        status: 400,
        message: 'Información solicitada es requerida'
      };
    }

    const solicitud = await this.solicitudRepository.cambiarEstado(
      solicitud_id, 
      Solicitud.ESTADOS.PENDIENTE_INFO,
      { comentarios: `Información adicional solicitada: ${informacion_solicitada}` }
    );

    const solicitudInfoEntity = new SolicitudInformacion({
      solicitud_id,
      informacion_solicitada,
      plazo_dias: parseInt(plazo_dias),
      estado: SolicitudInformacion.ESTADOS.PENDIENTE,
      solicitado_por: usuario.id,
      fecha_limite: new Date(Date.now() + plazo_dias * 24 * 60 * 60 * 1000).toISOString()
    });

    await this.solicitudInformacionRepository.create(solicitudInfoEntity.toJSON());


    return {
      success: true,
      message: 'Información adicional solicitada exitosamente',
      data: solicitud
    };
  }
}

module.exports = SolicitarInformacionAdicional;