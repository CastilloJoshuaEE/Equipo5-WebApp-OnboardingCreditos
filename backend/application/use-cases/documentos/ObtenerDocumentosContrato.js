// backend/application/use-cases/documentos/ObtenerDocumentosContrato.js
class ObtenerDocumentosContrato{
    constructor(supabase){
        this.supabase = supabase;
    }
    async execute(solicitud_id, usuario){
        console.log(`Obteniendo documentos de contrato para solicitud: ${solicitud_id}`);
        let query = this.supabase
        .from ('contratos')
        .select(`
            *,
            firmas_digitales(
            id,
            estado,
            fecha_firma_completa,
            url_documento_firmado,
            ruta_documento
            )
            `)
        .eq('solicitud_id', solicitud_id);
        if(usuario.rol === 'solicitante'){
            const {data: solicitud} = await this.supabase
                .from('solicitudes_creditos')
                .select('solicitante_id')
                .eq('id', solicitud_id)
                .single();
            if(!solicitud || solicitud.solicitante_id !== usuario.id){
                return {
                    success: false,
                    status: 403,
                    mssage: 'No tienes permisos para acceder a estos documentos'
                };
            }
        }
        const {data: contrato, error} = await query.single();
        if(error || !contrato){
            return {
                success: false,
                status: 404,
                message: 'Contrato no encontrado'
            };
        }
        return {
            success: true,
            data: {
                contrato: {
                    id: contrato.id,
                    numero_contrato: contrato.numero_contrato,
                    estado: contrato.estado,
                    ruta_documento: contrato.ruta_documento,
                    fecha_creacion: contrato.created_at
                },
                firma: contrato.firmas_digitales?.[0] || null
            }
        };
    }
}
module.exports = ObtenerDocumentosContrato;