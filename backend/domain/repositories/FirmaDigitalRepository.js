// backend/domain/repositories/FirmaDigitalRepository.js
class FirmaDigitalRepository{
    async crear(firmaData){
        throw new Error('Método no implementado');
    }
    async actualizar(id, updateData){
        throw new Error('Método no implementado');
    }
    async obtenerPorId(id){
        throw new Error('Método no implementado');
    }
    async obtenerPorSolicitud(solicitudId){
        throw new Error('Método no implementado');
    }
    async obtenerInfoParaFirma(firmaId){
        throw new Error('Método no implementado');
    }
    async obtenerPendientesPorUsuario(usuarioId, usuarioRol){
        throw new Error('Método no implementado');
    }
    async verificarFirmaActiva(solicitudId){
        throw new Error('Método no implementado');
    }
    async verificarPermisos(firmaId, usuarioId, usuarioRol){
        throw new Error('Método no implementado');
    }
    async verificarPuedeReiniciar(firmaId){
        throw new Error('Método no implementado');
    }
    async renovarFirmaExpirada(firmaId){
        throw new Error('Método no implementado');
    }
    async repararRelacionFirmaContrato(firmaId){
        throw new Error('Método no implementado');
    }
    async actualizarUrlsFirma(firmaId, urlsFirma){
        throw new Error('Método no implementado');
    }
    async obtenerAuditoria(firmaId){
        throw new Error('Método no implementado');
    }
    async registrarAuditoria(auditoriaData){
        throw new Error('Método no implementado');
    }
    async obtenerEstadisticas(usuarioId = null, usuarioRol = null){
        throw new Error('Método no implementado');
    }
}
module.exports = FirmaDigitalRepository;