// backend/domain/repositories/ContratoRepository.js
class ContratoRepository{
    async crear(contratoData){
        throw new Error('Método no implementado');
    }
    async actualizar(id, updateData){
        throw new Error('Método no implementado');
    }
    async obtenerPorId(id){
        throw new Error('Método no implementado');
    }
    async obtenerPorSolicitud(solicitudId) {
        throw new Error('Método no implementado');
    }

    async obtenerPorUsuario(usuarioId, usuarioRol, filtros = {}) {
        throw new Error('Método no implementado');
    }
    async actualizarRutaDocumento(contratoId, rutaDocumento){
        throw new Error('Método no implementado');
    }
    async obtenerInformacionFirmas(solicitudId){
        throw new Error('Método no implementado');
    }
    async verificarEstadoParaFirma(firmaId){
        throw new Error('Método no implementado');
    }
    async obtenerParaFirma(firmaId){
        throw new Error('Método no implementado');
    }
    async verificarPermisos(contratoId, usuarioId, usuarioRol){
        throw new Error('Método no implementado');
    }
    async obtenerEstadisticas(usuarioId = null, usuarioRol = null){
        throw new Error('Método no implementado');
    }
}
module.exports = ContratoRepository;
