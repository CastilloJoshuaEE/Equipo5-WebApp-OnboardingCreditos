// backend/application/use-cases/chatbot/ProcesarMensaje.js
const ChatbotInteraccion = require('../../../domain/entities/ChatbotInteraccion');

class ProcesarMensaje {
    constructor(chatbotRepository, geminiService) {
        this.chatbotRepository = chatbotRepository;
        this.geminiService = geminiService;
    }

    async execute({ mensaje, usuario = null }) {
        // Validar mensaje
        if (!mensaje || mensaje.trim().length === 0) {
            return {
                success: false,
                status: 400,
                message: 'El mensaje no puede estar vacío'
            };
        }
        if (mensaje.length > 1000) {
            return {
                success: false,
                status: 400,
                message: 'El mensaje es demasiado largo (máx 1000 caracteres)'
            };
        }

        console.log(`Chatbot - Mensaje recibido:`, {
            usuario: usuario ? usuario.email : 'No autenticado',
            mensaje: mensaje.substring(0, 100)
        });

        try {
            const respuestaGemini = await this.geminiService.generarRespuesta(mensaje, usuario);
            
            // Analizar sentimiento del mensaje
            const sentimiento = this.geminiService.analizarSentimiento 
                ? this.geminiService.analizarSentimiento(mensaje) 
                : 'neutro';

            // Crear entidad de interacción
            const interaccion = new ChatbotInteraccion({
                usuario_id: usuario ? usuario.id : null,
                pregunta: mensaje,
                respuesta: respuestaGemini, 
                sentimiento: sentimiento
            });

            // Guardar en repositorio - solo si hay usuario autenticado
            let interaccionGuardada = null;
            if (usuario) {
                try {
                    // CORRECCIÓN: Asegurar que no enviamos id null
                    const datosParaGuardar = interaccion.toJSON();
                    console.log('Datos a guardar:', datosParaGuardar);
                    
                    interaccionGuardada = await this.chatbotRepository.crearInteraccion(datosParaGuardar);
                    console.log(`Chatbot - Interacción guardada para usuario: ${usuario.id}`);
                } catch (saveError) {
                    console.error('Error guardando interacción en DB, pero continuando:', saveError);
                    // No interrumpimos el flujo, solo continuamos
                }
            } else {
                console.log('Chatbot - Usuario no autenticado, no se guarda interacción en DB');
            }

            // asegurar que respuestaGemini es un string antes de usar substring
            const respuestaPreview = respuestaGemini && typeof respuestaGemini === 'string' 
                ? respuestaGemini.substring(0, 100) 
                : 'Respuesta generada';
            
            console.log(`Chatbot - respuesta generada: ${respuestaPreview}...`);

            return {
                success: true,
                data: {
                    respuesta: respuestaGemini,
                    interaccionId: interaccionGuardada ? interaccionGuardada.id : null,
                    timestamp: interaccionGuardada ? interaccionGuardada.created_at : new Date().toISOString(),
                    usuario: usuario ? {
                        id: usuario.id,
                        nombre: usuario.nombre_completo,
                        rol: usuario.rol
                    } : null
                }
            };

        } catch (error) {
            console.error('Error en ProcesarMensaje:', error);
            return {
                success: false,
                status: 500,
                message: error.message || 'Error interno del servidor al procesar el mensaje'
            };
        }
    }
}

module.exports = ProcesarMensaje;