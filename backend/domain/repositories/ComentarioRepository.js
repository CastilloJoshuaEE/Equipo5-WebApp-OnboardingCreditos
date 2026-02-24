//backend/domain/repositories/ComentarioRepository.js
/**
 * Interfaz del repositorio de comentarios
 */
class ComentarioRepository{
    async crear(comentarioData){
        throw new Error('Método no implementado');
    }
    async obtenerPorSolicitud(solicitudId, filtros={}){
        throw new Error('Método no implementado');
    }
    async obtenerPorId(id){
        throw new Error('Método no implementado');
    }
    async marcarComoLeidos(solicitudId, usuarioId){
        throw new Error('Método no implementado');
    }
    async obtenerContadorNoLeidos(usuarioId){
        throw new Error('Método no implementado');
    }
    async eliminar(id){
        throw new Error('Método no implementado');
    }
    async verificarPermisos(comentarioId, usuarioId, usuarioRol){
        throw new Error('Método no implementado');
    }
    async verificarPermisosSolicitud(solicitudId, usuarioId, usuarioRol){
        throw new Error('Método no implementado');
    }
    async obtenerEstadisticas(usuarioId, usuarioRol){
        throw new Error('Método no implementado');
    }
    async buscar(texto, usuarioId, usuarioRol, limit=20){
        throw new Error('Método no implementado');
    }
}
module.exports = ComentarioRepository;
