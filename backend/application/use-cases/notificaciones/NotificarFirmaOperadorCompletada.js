// backend/application/use-cases/notificaciones/NotificarFirmaOperadorCompletada.js
const Notificacion = require('../../../domain/entities/Notificacion');
class NotificarFirmaOperadorCompletada{
    constructor(notificacionRepository, supabase){
        this.notificacionRepository = notificacionRepository;
        this.supabase = supabase;
    }
    async execute(contratoId){
        const { data: contrato} = await this.supabase
            .from('contratos')
            .select(`
                *,
                solicitudes_credito(
                    solicitante_id
                )
                `)
            .eq('id', contratoId)
            .single();
        if(contrato && contrato.solicitudes_credito){
            const notificacion = new Notificacion({
                usuario_id: contrato.solicitudes_credito.solicitante_id,
                tipo: Notificacion.TIPOS.FIRMA_OPERADOR_COMPLETADA,
                titulo: 'Operador ha firmado el contrato',
                mensaje: 'El operador ha completado su firma digital. El proceso de firma está casi completo.',
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
module.exports = NotificarFirmaOperadorCompletada;
