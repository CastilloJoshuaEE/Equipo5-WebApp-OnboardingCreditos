const geminiService = require('../servicios/GeminiService');
const { supabase } = require('../config/conexion');

class ChatbotController {
    
    /**
     * Procesar mensaje del chatbot
     */
    static async procesarMensaje(req, res) {
        try {
            const { mensaje } = req.body;
            const usuario = req.usuario || null; // Puede ser null para usuarios no autenticados

            console.log(`🤖 Chatbot - Mensaje recibido:`, {
                usuario: usuario ? usuario.email : 'No autenticado',
                mensaje: mensaje.substring(0, 100)
            });

            if (!mensaje || mensaje.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El mensaje no puede estar vacío'
                });
            }

            // Validar longitud del mensaje
            if (mensaje.length > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'El mensaje es demasiado largo (máximo 1000 caracteres)'
                });
            }

            // Generar respuesta usando Gemini
            const respuesta = await geminiService.generarRespuesta(mensaje, usuario);

            // Registrar la interacción en la base de datos (opcional)
            if (usuario) {
                await ChatbotController.registrarInteraccion(usuario.id, mensaje, respuesta);
            }

            console.log(`🤖 Chatbot - Respuesta generada: ${respuesta.substring(0, 100)}...`);

            res.json({
                success: true,
                data: {
                    respuesta,
                    timestamp: new Date().toISOString(),
                    usuario: usuario ? {
                        id: usuario.id,
                        nombre: usuario.nombre_completo,
                        rol: usuario.rol
                    } : null
                }
            });

        } catch (error) {
            console.error('❌ Error en ChatbotController:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al procesar el mensaje'
            });
        }
    }

    /**
     * Registrar interacción del chatbot (opcional)
     */
    static async registrarInteraccion(usuarioId, pregunta, respuesta) {
        try {
            const interaccionData = {
                usuario_id: usuarioId,
                pregunta,
                respuesta,
                sentimiento: geminiService.analizarSentimiento(pregunta),
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('chatbot_interacciones')
                .insert([interaccionData]);

            if (error) {
                console.warn('⚠️ Error registrando interacción del chatbot:', error);
            }

        } catch (error) {
            console.warn('⚠️ Error en registrarInteraccion:', error);
        }
    }

    /**
     * Obtener historial de conversaciones (solo para usuarios autenticados)
     */
    static async obtenerHistorial(req, res) {
        try {
            const usuarioId = req.usuario.id;
            const { limit = 20, offset = 0 } = req.query;

            const { data: interacciones, error } = await supabase
                .from('chatbot_interacciones')
                .select('*')
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: false })
                .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

            if (error) throw error;

            res.json({
                success: true,
                data: interacciones || []
            });

        } catch (error) {
            console.error('❌ Error obteniendo historial del chatbot:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el historial de conversaciones'
            });
        }
    }

    /**
     * Endpoint de salud del chatbot
     */
    static async healthCheck(req, res) {
        try {
            // Probar con un mensaje simple para verificar que Gemini funciona
            const testResponse = await geminiService.generarRespuesta('Hola', null);
            
            res.json({
                success: true,
                message: 'Chatbot funcionando correctamente',
                data: {
                    servicio: 'Gemini API',
                    estado: 'activo',
                    prueba: testResponse ? 'exitosa' : 'fallida'
                }
            });

        } catch (error) {
            console.error('❌ Health check del chatbot falló:', error);
            res.status(503).json({
                success: false,
                message: 'Chatbot temporalmente no disponible',
                error: error.message
            });
        }
    }
}

module.exports = ChatbotController;