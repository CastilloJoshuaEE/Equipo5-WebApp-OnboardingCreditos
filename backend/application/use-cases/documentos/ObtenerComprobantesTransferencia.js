// backend/application/use-cases/documentos/ObtenerComprobantesTransferencia.js
class ObtenerComprobantesTransferencia{
    constructor(supabase){
        this.supabase = supabase;
    }
    async execute(solicitud_id, usuario){
        let query = this.supabase
            .from('transferencias_bancarias')
            .select(`
                *, 
                contactos_bancarios(
                    nombre_banco,
                    numero_cuenta,
                    tipo_cuenta
                )
                `)
            .eq('solicitud_id', solicitud_id)
            .order('created_at', {ascending: false});
        if(usuario.rol === 'solicitante'){
            const{data: solicitud} = await this.supabase
                .from('solicitudes_credito')
                .select('solicitante_id')
                .eq('id', solicitud_id)
                .single();
            if(!solicitud || solicitud.solicitante_id !== usuario.id){
                return {
                    success: false,
                    status: 403,
                    message: 'No tienes permisos para acceder a estos comprobantes'
                };
            }
        }
        const{data: transferencias, error} = await query;
        if( error){
            return {
                success: false,
                status: 500,
                message: 'Error al obtener comprobantes'
            };
        }
        return {
            success: true,
            data: transferencias || []
        };
    }
}
module.exports = ObtenerComprobantesTransferencia;
