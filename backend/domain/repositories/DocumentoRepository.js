// backend/domain/repositories/DocumentoRepository.js
class DocumentoRepository{
    async crear(documentoData){
        throw new Error('Método no implementado');
    }
    async actualizar(id, updates){
        throw new Error('Método no implementado');
    }
    async eliminar(id){
        throw new Error('Método no implementado');
    }
    async obtenerPorId(id){
        throw new Error('Método no implementado');
    }
    async obtenerPorSolicitud(solicitudId){
        throw new Error('Método no implementado');
    }
    async obtenerPorTipoYSolicitud(solicitudId, tipo){
        throw new Error('Método no implementado');
    }
    async obtenerPorEstado(solicitudId, estado){
        throw new Error('Método no implementado');
    }
    async contarPorTipoYEstado(solicitudId, tipo, estado){
        throw new Error('Método no implementado');
    }
    async verificarDocumentosObligatorios(solicitudId){
        throw new Error('Método no implementado');
    }
    async obtenerEstadisticas(solicitudId){
        throw new Error('Método no implementado');
    }
    async obtenerRecientes(limite = 10){
        throw new Error('Método no implementado');
    }
    async buscar(criterios){
        throw new Error('Método no implementado');
    }
    async obtenerParaEvaluacion(operadorId = null){
        throw new Error('Método no implementado');
    }
    async registrarEvaluacion(evaluacionData){
        throw new Error('Método no implementado');
    }
    async obtenerHistorialEvaluaciones(documentoId){
        throw new Error('Método no implementado');
    }
    async verificarPermisos(documentoId, usuarioId, usuarioRol){
        throw new Error('Método no implementado');
    }
    async obtenerAgrupadosPorTipo(solicitudId){
        throw new Error('Método no implementado');
    }
}
module.exports = DocumentoRepository;