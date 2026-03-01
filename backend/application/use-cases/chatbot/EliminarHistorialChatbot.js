// backend/application/use-cases/chatbot/EliminarHistorialChatbot.js
class EliminarHistorialChatbot{
    constructor(chatbotRepository){
        this.chatbotRepository = chatbotRepository;
    }
    async execute(usuarioId, {interaccionIds= null}){
        try{
            const resultado = await this.chatbotRepository.eliminarHistorialChatbot(usuarioId, interaccionIds);
            return{
                success: true,
                data:resultado
            }; 
        } catch( error){
            console.error('Error en EliminarHistorialChatbot:', error);
            return{
                success: false,
                status: 500,
                message: 'Error al eliminar el historial'
            };
        }
    }
}
module.exports = EliminarHistorialChatbot;
