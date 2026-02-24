// backend/application/use-cases/contratos/ObtenerContenidoContrato.js
class ObtenerContenidoContrato{
    constructor(contratoRepository, supabase){
        this.contratoRepository = contratoRepository;
        this.supabase = supabase;
    }
    async execute(firma_id){
        const firma = await this.contratoRepository.obtenerParaFirma(firma_id);
        if(!firma){
            return{
                success: false,
                status: 404,
                message: 'Proceso de firma no encontrado'
            };
        }
        const rutaDocumento = firma.ruta_documento || firma.contratos.ruta_documento;
        if(!rutaDocumento){
            return{
                success:false,
                status: 404,
                message: 'Documento no disponible'
            };
        }
        const{ data: fileData, error} = await this.supabase.storage
            .from('kyc-documents')
            .download(rutaDocumento);
        if(error){
            return {
                success: false,
                status: 404,
                message: 'Error accediendo al documento'
            };
        }
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return {
        success: true,
        data: {
            nombre: rutaDocumento.split('/').pop() || 'contrato.docx',
            tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            tamanio: buffer.length,
            informacion: 'Documento Word listo para firma digital'
        }
        };
    }
}

module.exports = ObtenerContenidoContrato;