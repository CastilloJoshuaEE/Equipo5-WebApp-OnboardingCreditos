// backend/application/use-cases/firmas/DescargarDocumentoFirmado.js
class  DescargarDocumentoFirmado{
    constructor(firmaDigitalRepository, supabase){
        this.firmaDigitalRepository = firmaDigitalRepository;
        this.supabase = supabase;

    }
    async execute(firma_id, usuario){
        console.log('Descargando documento firmado para firma:', firma_id);
        // Obtener información completa de la firma
        const { data: firma, error} = await this.supabase
            .from('firmas_digitales')
            .select(`
                id,
                estado, 
                url_documento_firmado,
                ruta_documento,
                hash_documento_firmado,
                fecha_firma_completa,
                solicitud_id,
                contrato_id,
                contratos(
                    id,
                    estado, 
                    ruta_documento,
                    numero_contrato
                )
                `)
            .eq('id', firma_id)
            .single();
        if(error || !firma){
            console.error('Error obteniendo firma:', error);
            return {
                success: false,
                status: 404,
                message: 'Proceso de firma no encontrado'
            };
        }
        console.log('Estado de la firma:', firma.estado);
        const estadosPermitidos =['firmado_completo', 'firmado_solicitante', 'firmado_operador'];
        if(!estadosPermitidos.includes(firma.estado)){
            return {
                success: false,
                status: 400,
                message: `El contrato no está firmado. Estado actual: ${firma.estado}`
            };
        }
        if(!firma.url_documento_firmado){
            return {
                success: false,
                status: 404,
                message: 'Documento firmado no disponible para esta firma'
            };
        }
        const rutaDescarga = firma.url_documento_firmado;
        const nombreArchivo = `contrato-firmado-${firma.contratos?.numero_contrato || firma_id}.docx`;
        console.log('Descargando documento firmado desde:', rutaDescarga);
        const {data: fileData, error: downloadError} = await this.supabase.storage
            .from('kyc-documents')
            .download(rutaDescarga);
        if(downloadError){
            console.error('Error descargando archivo:', downloadError);
            return {
                success: false,
                status: 404,
                message: 'Error al acceder al archivo firmado:'+downloadError.message
            };
        }
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
            success: true,
            data: {
                buffer,
                nombre_archivo: nombreArchivo,
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
        };
    
    }
}
module.exports = DescargarDocumentoFirmado;
