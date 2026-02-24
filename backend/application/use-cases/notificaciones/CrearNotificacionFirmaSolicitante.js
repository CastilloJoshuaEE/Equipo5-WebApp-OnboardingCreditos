// backend/application/use-cases/notificaciones/CrearNotificacionFirmaSolicitante.js
const Notificacion = require('../../../domain/entities/Notificacion');
class CrearNotificacionFirmaSolicitante{
    constructor(notificacionRepository){
        this.notificacionRepository = notificacionRepository;
    }
    async execute (solicitanteId, solicitudId, firmaId){
        const notificacion = new Notificacion({
            usuario_id: solicitanteId,
            solicitud_id: solicitudId,
            tipo: Notificacion.TIPOS.FIRMA_DIGITAL_SOLICITANTE,
            titulo: 'Solicitud de firma digital - Contrato de crédito',
            mensaje: 'Se ha enviado una solicitud de firma digital para tu contrato de crédito aprobado. Por favor, revisa y firma el documento',
            datos_adiciones: {
                url_firma: `/firmar-contrato/${firmaId}`,
                tipo_firma: 'digital',
                firma_id: firmaId
            },
            leida: false
        });
        const notificacionCreada = await this.notificacionRepository.crear(notificacion.toJSON());
        return {
            success: true,
            data: notificacionCreada
        };
    }
}
module.exports = CrearNotificacionFirmaSolicitante;
