// backend/application/use-cases/chatbot/BuscarEnHistorial.js
class BuscarEnHistorial{
    constructor(chatbotRepository){
        this.chatbotRepository = chatbotRepository;
    }
    async execute(usuarioId, {query, limit=10}){
        if(!query || query.trim().length === 0){
            return {
                success: false,
                status:400,
                message: 'La consulta de búsqueda no puede estar vacía'
            };

        }
        try{
            const resultados = await this.chatbotRepository.buscarEnHistorial(
                usuarioId,
                query,
                parseInt(limit)
            );
            return {
                success: true,
                data: resultados
            };
        } catch(error){
            console.error('Error en BuscarEnHistorial:', error);
            return{
                success: false,
                status: 500,
                message: 'Error al buscar en el historial'
            };
        }

    }

}
module.exports = BuscarEnHistorial;
