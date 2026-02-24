// backend/application/use-cases/documentos/ObtenerDocumentosSolicitud.js
class ObtenerDocumentosSolicitud{
    constructor(documentoRepository){
        this.documentoRepository = documentoRepository;
    }
    async execute(solicitud_id){
        const documentos = await this.documentoRepository.obtenerPorSolicitud(solicitud_id);
        return {
            success: true,
            data:documentos
        };
    }
}
module.exports = ObtenerDocumentosSolicitud;
