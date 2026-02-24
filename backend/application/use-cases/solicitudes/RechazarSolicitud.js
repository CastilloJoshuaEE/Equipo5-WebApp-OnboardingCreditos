// backend/application/use-cases/solicitudes/RechazarSolicitud.js
const Solicitud = require('../../../domain/entities/Solicitud');

class RechazarSolicitud {
  constructor(solicitudRepository) {
    this.solicitudRepository = solicitudRepository;
  }

  async execute(solicitud_id, { motivo_rechazo }, usuario) {
    if (!motivo_rechazo) {
      return {
        success: false,
        status: 400,
        message: 'Motivo del rechazo es requerido'
      };
    }

    if (usuario.rol !== 'operador') {
      return {
        success: false,
        status: 403,
        message: 'Solo los operadores pueden rechazar solicitudes'
      };
    }

    const datosAdicionales = {
      motivo_rechazo,
      operador_id: usuario.id
    };

    const solicitud = await this.solicitudRepository.cambiarEstado(
      solicitud_id, 
      Solicitud.ESTADOS.RECHAZADO, 
      datosAdicionales
    );

    return {
      success: true,
      message: 'Solicitud rechazada',
      data: solicitud
    };
  }
}

module.exports = RechazarSolicitud;