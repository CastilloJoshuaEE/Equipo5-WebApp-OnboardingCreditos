// backend/application/use-cases/chatbot/ProcesarMensaje.js
const ChatbotInteraccion = require('../../../domain/entities/ChatbotInteraccion');
class ProcesarMensaje{
    constructor(chatbotRepository, geminiService){
        this.chatbotRepository = chatbotRepository;
        this.geminiService = geminiService;
    }
    async execute({mensaje, usuario= null}){
        // Validar mensaje
        if(!mensaje || mensaje.trim().length ===0){
            return{
                success: false, 
                status: 400,
                message: 'El mensaje no puede estar vacío'
            };
        }
        if(mensaje.length>1000){
            return{
                success: false,
                status: 400,
                message: 'El mensaje es demasiado largo(máx 1000 caracteres)'
            };
        }
        console.log(`Chatbot - Mensaje recibido:`,{
            usuario: usuario ? usuario.email : 'No autenticado',
            mensaje: mensaje.substring(0,100)
        });
        try{
            // Procesar con Gemini
            const respuestaGemini = await this.geminiService.generateResponse(mensaje, usuario);
            // Crear entidad de interacción
            const interaccion = new ChatbotInteraccion({
                usuario_id: usuario ? usuario.id : null,
                pregunta: mensaje,
                respuesta: respuestaGemini.respuesta,
                sentimiento: respuestaGemini.sentimiento || 'neutral'
            });
            // Guardar en repositorio
            const interaccionGuardada = await this.chatbotRepository.crearInteraccion(interaccion.toJSON());
            console.log(`chatbot - respuesta generada: ${respuestaGemini.respuesta.substring(0,100)}...`);
            return{
                success: true,
                data: {
                    respuesta: respuestaGemini.respuesta,
                    interaccionId: interaccionGuardada.id,
                    timestamp: interaccionGuardada.created_at,
                    usuario: usuario? {
                        id: usuario.id,
                        nombre: usuario.nombre_completo,
                        rol: usuario.rol
                    }: null
                }
            };

        } catch(error){
            console.error('Error en ProcesarMensaje:', error);
            return{
                success: false,
                status: 500,
                message: error.message || 'Error interno del servidor al procesar el mensaje'
            };
        }
    }
}
module.exports = ProcesarMensaje;
