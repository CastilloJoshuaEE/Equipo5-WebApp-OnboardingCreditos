// backend/application/use-cases/solicitudes/AprobarSolicitud.js

const Solicitud = require('../../../domain/entities/Solicitud');

class AprobarSolicitud {
  constructor(solicitudRepository, notificacionService, generarContratoUseCase) {
    this.solicitudRepository = solicitudRepository;
    this.notificacionService = notificacionService;
    this.generarContratoUseCase = generarContratoUseCase;
  }

    async execute(solicitud_id, { comentarios, condiciones } = {}, usuario) {
        // 1. Verificar rol
        if (!usuario || usuario.rol !== 'operador') {
            return {
                success: false,
                status: 403,
                message: 'Solo los operadores pueden aprobar solicitudes'
            };
        }

        // 2. Obtener solicitud
        const solicitudActual = await this.solicitudRepository.findById(solicitud_id);

        if (!solicitudActual) {
            return {
                success: false,
                status: 404,
                message: 'Solicitud no encontrada'
            };
        }

        // 3. Validar estado
        const estadosValidos = [
            Solicitud.ESTADOS.EN_REVISION,
            Solicitud.ESTADOS.PENDIENTE_INFO
        ];
        if (!estadosValidos.includes(solicitudActual.estado)) {
            return {
                success: false,
                status: 400,
                message: 'La solicitud no está en estado válido para aprobación'
            };
        }

        // 4. Cambiar estado
        const solicitud = await this.solicitudRepository.cambiarEstado(
            solicitud_id,
            Solicitud.ESTADOS.APROBADO,
            {
                comentarios: comentarios || 'Solicitud aprobada',
                operador_id: usuario.id
            }
        );

        // 5. Generar contrato — fallo NO interrumpe el flujo
        try {
            await this.generarContratoUseCase.execute(solicitud_id);
        } catch (error) {
            console.error('Error generando contrato (no crítico):', error.message);
        }

        // 6. Notificar al solicitante — bloque INDEPENDIENTE, siempre se ejecuta
        try {
            await this.notificacionService.notificarAprobacionSolicitud(
                solicitud_id,
                solicitudActual.solicitante_id,
                usuario.id
            );
        } catch (error) {
            console.error('Error enviando notificación de aprobación (no crítico):', error.message);
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