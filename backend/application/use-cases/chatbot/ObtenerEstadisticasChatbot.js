// backend/application/use-cases/chatbot/ObtenerEstadisticasChatbot.js
class ObtenerEstadisticasChatbot{
    constructor(chatbotRepository){
        this.chatbotRepository = chatbotRepository;
    }
    async execute(usuarioId){
        try{
            const estadisticas = await this.chatbotRepository.obtenerEstadisticas(usuarioId);
            return {
                success: true,
                data: estadisticas
            };
        } catch(error){
            console.error('Error en ObtenerEstadisticasChatbot:', error);
            return{ 
                success: false,
                status: 500,
                message: 'Error al obtener las estadisticas'
            };
        }
    }
}
module.exports = ObtenerEstadisticasChatbot;
