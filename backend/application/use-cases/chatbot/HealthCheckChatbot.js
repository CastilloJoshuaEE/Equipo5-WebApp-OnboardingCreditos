// backend/application/use-cases/chatbot/HealthCheckChatbot.js
class HealthCheckChatbot{
    constructor(chatbotRepository){
        this.chatbotRepository = chatbotRepository;
    }
    async execute(){
        try{
            const healthStatus = await this.chatbotRepository.healthCheck();
            return {
                success: true,
                message: 'Chatbot funcionando correctamente',
                data: healthStatus
            };
        } catch(error){
            console.error('Health check del chatbot falló:', error);
            return{
                success: false,
                status: 503,
                message: 'Chatbot temporalmente no disponible',
                error: error.message
            };
        }
    }
}
module.exports = HealthCheckChatbot;
