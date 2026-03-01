// backend/domain/repositories/ChatbotRepository.js
/**
 * Interfaz del repositorio de chatbot
 */
class ChatbotRepository{
    async crearInteraccion(interaccionData){
        throw new Error('Método no implementado');
    }
    async obtenerHistorial(usuarioId, limit =20, offset=0){
        throw new Error('Método no implementado');
    }
    async buscarEnHistorial(usuarioId, query, limit = 10){
        throw new Error('Método no implementado');
    }
    async obtenerEstadisticas(usuarioId){
        throw new Error('Método no implementado');
    }
    async eliminarInteracciones(usuarioId, interaccionIds = null){
        throw new Error('Método no implementado');
    }
    async healthCheck(){
        throw new Error('Método no implementado');
    }
}
module.exports = ChatbotRepository;