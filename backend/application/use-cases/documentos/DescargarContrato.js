// backend/application/use-cases/documentos/DescargarContrato.js
class DescargarContrato{
    constructor(supabase){
        this.supabase = supabase;
    }
    async execute(contrato_id, usuario){
        console.log(`Descargando contrato:${contrato_id}`);
        // Obtener información del contrato
        const {data: contrato, error: contratoError} = await this.supabase
            .from('contratos')
            .select(`
                *,
                solicitudes_credito(
                    solicitante_id,
                    operador_id
                ),
                firmas_digitales(
                    url_documento_firmado,
                    ruta_documento
                )
                `)
            .eq('id', contrato_id)
            .single();
        if(contratoError || !contrato){
            return {
                success: false,
                status: 404,
                message: 'Contrato no encontrado'
            };
        }
        // Verificar permisos
        const solicitud = contrato.solicitudes_credito;
        if(usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id){
            return{
                success: false,
                status: 403,
                message: 'No tienes permisos para descargar este contrato'
            };
        }
        if(usuario.rol === 'operador' && solicitud.operador_id !== usuario.id){
            return {
                success: false,
                status: 403,
                message: 'No tienes permisos para descargar este contrato'
            };
        }
        // Determinar que documento descargar
        let rutaDescarga = contrato.ruta_documento;
        if(contrato.firmas_digitales?.[0]?.url_documento_firmado){
            rutaDescarga = contrato.firmas_digitales[0].url_documento_firmado;
        } else if(contrato.firmas_digitales?.[0]?.ruta_documento){
            rutaDescarga = contrato.firmas_digitales[0].ruta_documento;
        }
        if(!rutaDescarga){
            return {
                success: false,
                status: 404,
                message: 'Documento del contrato no disponible'
            };
        }
        // Descargar archivo 
        const {data: fileData, error: downloadError} = await this.supabase.storage
            .from('kyc-documents')
            .download(rutaDescarga);
        if(downloadError){
            return {
                success: false,
                status: 404,
                message: 'Error al descargar el documento'
            };
        }
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const esWord = rutaDescarga.toLowerCase().endsWith('.docx');
        const contentType = esWord ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/pdf';
        const extension = esWord ? 'docx' : 'pdf';
        const nombreArchivo = `contrato-${contrato.numero_contrato}.${extension}`;
        return {
            success: true,
            data: {
                buffer,
                nombre_archivo: nombreArchivo,
                content_type: contentType
            }
        };

    }

}
module.exports = DescargarContrato;
