// backend/application/use-cases/notificaciones/NotificarExpiracionFirma.js
const Notificacion = require('../../../domain/entities/Notificacion');
class NotificarExpiracionFirma{
    constructor(notificacionRepository, supabase){
        this.notificacionRepository = notificacionRepository,
        this.supabase = supabase;
    }
    async execute(contratoId){
        const {data:contrato}=await this.supabase
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
            const notifOperador = new Notificacion({
                usuario_id: solicitud.operador_id,
                tipo: Notificacion.TIPOS.FIRMA_EXPIRADA_OPERADOR,
                titulo: 'Firma digital expirada',
                mensaje: 'El proceso de firma digital ha expirado. Se requiere acción del operador.',
                leida: false
            });
            const notifSolicitante = new Notificacion({
                usuario_id: solicitud.solicitante_id,
                tipo: Notificacion.TIPOS.FIRMA_EXPIRADA_SOLICITANTE,
                titulo: 'Firma digital expirada',
                mensaje: 'El tiempo para firmar el contrato ha expirado. Por favor, contacta al operador',
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
module.exports = NotificarExpiracionFirma;
