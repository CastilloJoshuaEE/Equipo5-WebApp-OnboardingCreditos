// backend/domain/repositories/NotificacionRepository.js
class NotificacionRepository{
    async crear(notificacionData){
        throw new Error('Método no implementado');
    }
    async obtenerPorUsuario(usuarioId, filtros = {}){
        throw new Error('Método no implementado');
    }
    async obtenerContador(usuarioId, leida=null){
        throw new Error('Método no implementado');
    }
    async marcarComoLeida(id, usuarioId){
        throw new Error('Método no implementado');
    }
    async marcarTodasComoLeidas(usuarioId){
        throw new Error('Método no implementado');
    }
    async verificarPropiedad(id, usuarioId){
        throw new Error('Método no implementado');
    }
    async crearParaFirma(solicitanteId, operadorId, solicitudId, firma){
        throw new Error('Método no implementado');
    }
    async crearParaComentario(solicitud, comentario, usuarioOrigen){
        throw new Error('Método no implementado');
    }
    async notificarAprobacionSolicitud(solicitudId, solicitanteId, operadorId){
        throw new Error('Método no implementado');
    }
    async notificarErrorFirmaDigital(operadorId, solicitudId, errorMessage){
        throw new Error('Método no implementado');
    }
    async notificarCambioEstado(solicitudId, usuarioId, estadoAnterior, estadoNuevo, comentarios =''){
        throw new Error('Método no implementado');
    }
    async notificarVencimientoPlazo(usuarioId, solicitudId, tipoPlazo, diasRestantes =0){
        throw new Error('Método no implementado');
    }
}
module.exports = NotificacionRepository;
