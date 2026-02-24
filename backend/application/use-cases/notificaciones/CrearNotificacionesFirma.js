// backend/application/use-cases/notificaciones/CrearNotificacionesFirma.js
const Notificacion = require('../../../domain/entities/Notificacion');
class CrearNotificacionesFirma{
    constructor(notificacionRepository){
        this.notificacionRepository = notificacionRepository;
    }
    async execute (solicitanteId, operadorId, solicitudId, firma){
        const notificaciones = [];
        const notifSolicitante = new Notificacion({
            usuario_id: solicitanteId,
            solicitud_id: solicitudId,
            tipo: Notificacion.TIPOS.FIRMA_DIGITAL_SOLICITANTE,
            titulo: 'Solicitud de firma digital - Contrato de crédito',
            mensaje: 'Se ha enviado una solicitud de firma digital para tu contrato de crédito aprobado. Por favor, revisa y firma el documento',
            datos_adicionales: {
                url_firma: firma.url_firma_solicitante,
                tipo_firma: 'digital',
                expira_en: firma.fecha_expiracion,
                firma_id: firma.id
            },
            leida: false
        });
        const notifOperador = new Notificacion({
            usuario_id: operadorId,
            solicitud_id: solicitudId,
            tipo: Notificacion.TIPOS.FIRMA_DIGITAL_OPERADOR,
            titulo: 'Proceso de firma digital iniciado',
            mensaje: 'Se ha iniciado el proceso de firma digital para el contrato. El solicitante debe firmar primero.',
            datos_adicionales: {
                url_firma: firma.url_firma_operador,
                tipo_firma: 'digital',
                expira_en: firma.fecha_expiracion,
                firma_id: firma.id
            },
            leida: false
        });
        const notifSolicitanteCreada = await this.notificacionRepository.crear(notifSolicitante.toJSON());
        const notifOperadorCreada = await this.notificacionRepository.crear(notifOperador.toJSON());
        return {
            success: true,
            data: {
                solicitante: notifSolicitanteCreada,
                operador: notifOperadorCreada
            }
        };
    }
}
module.exports = CrearNotificacionesFirma;
