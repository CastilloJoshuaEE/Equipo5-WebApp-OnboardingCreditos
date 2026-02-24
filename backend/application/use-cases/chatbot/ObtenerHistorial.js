// backend/application/use-cases/chatbot/ObtenerHistorial.js
class ObtenerHistorial{
    constructor(chatbotRepository){
        this.chatbotRepository = chatbotRepository;
    }
    async execute(usuarioId, { limit= 20, offset=0}){
        try{
            const resultado = await this.chatbotRepository.ObtenerHistorial(
                usuarioId,
                parseInt(limit),
                parseInt(offset)
            );
            return{
                success: true,
                data:resultado
            };
        } catch(error){
            console.error('Error en ObtenerHistorial:', error);
            return{
                success: false,
                status: 500,
                message: 'Error al obtener el historial de conversaciones'
            };
        }
    }
}
module.exports = ObtenerHistorial;
