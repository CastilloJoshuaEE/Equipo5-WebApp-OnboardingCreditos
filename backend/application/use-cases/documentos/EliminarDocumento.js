// backend/application/use-cases/documentos/EliminarDocumento.js
class EliminarDocumento{
    constructor(documentoRepository){
        this.documentoRepository = documentoRepository;
    }
    async execute (documento_id){
        if(!documento_id){
            return {
                success: false,
                status: 400,
                message: 'Documento ID es requerido'
            };
        }
        // Obtener documento
        const documento = await this.documentoRepository.obtenerPorId(documento_id);
        if(!documento){
            return {
                success: false,
                status: 404,
                message: 'Documento no encontrado'
            };
        }
        // Eliminar archivo del storage
        try {
            await this.documentoRepository.eliminarArchivoStorage(documento.ruta_storage);
        } catch (storageError) {
            console.warn('Error eliminando archivo:', storageError.message);
        }
        // Eliminar registro de la base de datos
        await this.documentoRepository.eliminar(documento_id);
        return {
            success:true,
            message: 'Documento eliminado exitosamente'
        };
    }
}
module.exports = EliminarDocumento;
