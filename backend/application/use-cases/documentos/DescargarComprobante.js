// backend/application/use-cases/documentos/DescargarComprobante.js
class DescargarComprobante{
    constructor(supabase){
        this.supabase = supabase;
    }
    async execute(transferencia_id, usuario){
        console.log(`Descargando comprobante: ${transferencia_id}`);
        // Obtener información de la transferencia
        const {data: transferencia, error: transferenciaError} = await this.supabase
            .from('transferencias_bancarias')
            .select(`
                *,
                solicitudes_credito(
                    solicitante_id,
                    operador_id
                )
                `)
            .eq('id', transferencia_id)
            .single();
        if(transferenciaError || !transferencia){
            return {
                success: false,
                status: 404,
                message: 'Transferencia no encontrada'
            };
        }
        // Verificar permisos
        const solicitud = transferencia.solicitudes_credito;
        if(usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id){
            return {
                success: false,
                status: 403,
                message: 'No tienes permisos para descargar este comprobante'
            };
        }
        if(!transferencia.ruta_comprobante){
            return {
                success: false,
                status: 404,
                message: 'Comprobante no disponible para esta transferencia'
            };
        }
        // Descargar archivo
        const { data: fileData, error: downloadError} = await this.supabase.storage
            .from('kyc-documents')
            .download(transferencia.ruta_comprobante);
        if(downloadError){
            return {
                success: false,
                status: 404,
                message: 'Error al descargar el comprobante'
            };
        }
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const nombreArchivo = `comprobante-${transferencia.numero_comprobante}.pdf`;
        return {
            success: true,
            data: {
                buffer,
                nombre_archivo: nombreArchivo,
                content_type: 'application/pdf'
            }
        };
    }
}
module.exports = DescargarComprobante;
