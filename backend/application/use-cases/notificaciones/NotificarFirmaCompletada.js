// backend/application/use-cases/notificaciones/NotificarFirmaCompletada.js
const Notificacion = require('../../../domain/entities/Notificacion');
class NotificarFirmaCompletada{
    constructor(notificacionRepository, supabase){
        this.notificacionRepository = notificacionRepository;
        this.supabase = supabase;
    }
    async execute(contratoId, solicitudId){
        const { data: contrato} = await this.supabase
            .from('contratos')
            .select(`
                *,
                solicitudes_credito(
                    solicitante_id,
                    operador_id
                )
                `)
            .eq('id', contratoId)
            .single();
        if(contrato && contrato.solicitudes_credito){
            const solicitud = contrato.solicitudes_credito;
            const notificaciones = [];
            const notifOperador = new Notificacion({
                usuario_id: solicitud.operador_id,
                solicitud_id: solicitudId,
                tipo: Notificacion.TIPOS.FIRMA_COMPLETADA_OPERADOR,
                titulo: 'Firma Digital Completada',
                mensaje: 'El proceso de firma digital del contrato se ha completado exitosamente. El crédito está listo para desembolso.',
                leida: false  
            });
            const notifSolicitante = new Notificacion({
                usuario_id: solicitud.solicitante_id,
                solicitud_id: solicitudId,
                tipo: Notificacion.TIPOS.FIRMA_COMPLETADA_SOLICITANTE,
                titulo: 'Firma digital completada',
                mensaje: 'Felicidades! Has completado exitosamente la firma digital del contrato. Tu crédito será desembolsado pronto.',
                leida: false
            });
            const notifOperadorCreada = await this.notificacionRepository.crear(notifOperador.toJSON());
            const notifSolicitanteCreada = await this.notificacionRepository.crear(notifSolicitante.toJSON());
            return {
                success: true,
                data: {
                    operador: notifOperadorCreada,
                    solicitante: notifSolicitanteCreada
                }
            };
        }
        return {
            success: false,
            message: 'No se pudo encontrar el contrato o la solicitud asociada'
        };
    }
}
module.exports = NotificarFirmaCompletada;
