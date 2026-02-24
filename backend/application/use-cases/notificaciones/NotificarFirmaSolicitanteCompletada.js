// backend/application/use-cases/notificaciones/NotificarFirmaSolicitanteCompletada.js
const Notificacion = require('../../../domain/entities/Notificacion');
class NotificarFirmaSolicitanteCompletada{
    constructor(notificacionRepository, supabase){
        this.notificacionRepository = notificacionRepository;
        this.supabase = supabase;
    }
    async execute(contratoId){
        const {data:contrato} = await this.supabase
            .from('contratos')
            .select(`
                *,
                solicitudes_credito(
                    operador_id
                )
                `)
            .eq('id', contratoId)
            .single();
        if(contrato && contrato.solicitudes_credito){
            const notificacion = new Notificacion({
                usuario_id: contrato.solicitudes_credito.operador_id,
                tipo: Notificacion.TIPOS.FIRMA_SOLICITANTE_COMPLETADA,
                titulo: 'Solicitante ha firmado el contrato',
                mensaje: 'El solicitante ha completado la firma digital del contrato. Ahora es tu turno de firmar',
                leida: false
            });
            const notificacionCreada = await this.notificacionRepository.crear(notificacion.toJSON());
            return {
                success: true,
                data: notificacionCreada
            };
        }
        return {
            success: false,
            message: 'No se pudo encontrar el contrato o la solicitud asociada'
        };
    }

}
module.exports = NotificarFirmaSolicitanteCompletada;
