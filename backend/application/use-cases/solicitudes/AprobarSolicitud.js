// backend/application/use-cases/solicitudes/AprobarSolicitud.js

const Solicitud = require('../../../domain/entities/Solicitud');

class AprobarSolicitud {
  constructor(solicitudRepository, notificacionService, generarContratoUseCase) {
    this.solicitudRepository = solicitudRepository;
    this.notificacionService = notificacionService;
    this.generarContratoUseCase = generarContratoUseCase;
  }

  async execute(solicitud_id, { comentarios, condiciones }, usuario) {
    if (usuario.rol !== 'operador') {
      return {
        success: false,
        status: 403,
        message: 'Solo los operadores pueden aprobar solicitudes'
      };
    }

    const solicitudActual = await this.solicitudRepository.findById(solicitud_id);
    
    if (![Solicitud.ESTADOS.EN_REVISION, Solicitud.ESTADOS.PENDIENTE_INFO].includes(solicitudActual.estado)) {
      return {
        success: false,
        status: 400,
        message: 'La solicitud no está en estado válido para aprobación'
      };
    }

    const datosAdicionales = {
      comentarios: comentarios || 'Solicitud aprobada',
      operador_id: usuario.id
    };

    const solicitud = await this.solicitudRepository.cambiarEstado(
      solicitud_id, 
      Solicitud.ESTADOS.APROBADO, 
      datosAdicionales
    );

    if (condiciones) {
      await this.registrarCondicionesAprobacion(solicitud_id, condiciones, usuario.id);
    }

    try {
      const contrato = await this.generarContratoUseCase.execute(solicitud_id);

      // Pasar solo los IDs, no el objeto completo
      await this.notificacionService.notificarAprobacionSolicitud(
        solicitud_id,  
        solicitud.solicitante_id,
        usuario.id
      );

    } catch (error) {
      console.error('Error generando contrato o notificaciones:', error);
    }

    return {
      success: true,
      message: 'Solicitud aprobada exitosamente. El siguiente paso es la firma digital del contrato.',
      data: {
        ...solicitud,
        siguiente_paso: 'firma_digital',
        mensaje: 'La solicitud ha sido aprobada. Debe completarse el proceso de firma digital antes del desembolso.'
      }
    };
  }

  async registrarCondicionesAprobacion(solicitudId, condiciones, operadorId) {
    // Implementación para registrar condiciones
  }
}

module.exports = AprobarSolicitud;