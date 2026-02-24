// backend/application/use-cases/documentos/DescargarDocumento.js
class DescargarDocumento{
    constructor(documentoRepository){
        this.documentoRepository = documentoRepository;
    }
    async execute(documento_id, usuario){
        console.log(`Descargando documento:${documento_id}`);
        // Verificar permisos
        const tienePermisos = await this.documentoRepository.verificarPermisos(
            documento_id,
            usuario.id,
            usuario.rol
        );
        if(!tienePermisos){
            return{
                success: false,
                status: 403,
                message: 'No tienes permisos para acceder a este documento'
            };
        }
        // Obtener información del documento
        const documento = await this.documentoRepository.obtenerPorId(documento_id);
        if(!documento){
            return {
                success: false,
                status: 404,
                message: 'Documento no encontrado'
            };
        }
        // Descargar archivo
        const fileData = await this.documentoRepository.descargarArchivo(documento.ruta_storage);
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`Documento descargado:${documento.nombre_archivo}`);
        return {
            success: true,
            data: {
                buffer,
                nombre_archivo: documento.nombre_archivo,
                tipo: 'application/pdf',
                documento
            }
        };
    }

}
module.exports = DescargarDocumento;
