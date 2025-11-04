const ChatbotModel = require('../modelos/ChatbotModel');

class ChatbotController {
    
    /**
     * Procesar mensaje del chatbot
     */
    static async procesarMensaje(req, res) {
        try {
            const { mensaje } = req.body;
            const usuario = req.usuario || null;

            console.log(`. Chatbot - Mensaje recibido:`, {
                usuario: usuario ? usuario.email : 'No autenticado',
                mensaje: mensaje.substring(0, 100)
            });

            // Usar el modelo para procesar el mensaje
            const resultado = await ChatbotModel.procesarMensaje(mensaje, usuario);

            console.log(`. Chatbot - Respuesta generada: ${resultado.respuesta.substring(0, 100)}...`);

            res.json({
                success: true,
                data: {
                    respuesta: resultado.respuesta,
                    interaccionId: resultado.interaccionId,
                    timestamp: resultado.timestamp,
                    usuario: usuario ? {
                        id: usuario.id,
                        nombre: usuario.nombre_completo,
                        rol: usuario.rol
                    } : null
                }
            });

        } catch (error) {
            console.error('. Error en ChatbotController:', error);
            
            const statusCode = error.message.includes('vacío') || error.message.includes('largo') ? 400 : 500;
            
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Error interno del servidor al procesar el mensaje'
            });
        }
    }

    /**
     * Obtener historial de conversaciones
     */
    static async obtenerHistorial(req, res) {
        try {
            const usuarioId = req.usuario.id;
            const { limit = 20, offset = 0 } = req.query;

            const resultado = await ChatbotModel.obtenerHistorial(usuarioId, limit, offset);

            res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            console.error('. Error obteniendo historial del chatbot:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el historial de conversaciones'
            });
        }
    }

    /**
     * Buscar en historial
     */
    static async buscarEnHistorial(req, res) {
        try {
            const usuarioId = req.usuario.id;
            const { query, limit = 10 } = req.query;

            if (!query || query.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La consulta de búsqueda no puede estar vacía'
                });
            }

            const resultados = await ChatbotModel.buscarEnHistorial(usuarioId, query, limit);

            res.json({
                success: true,
                data: resultados
            });

        } catch (error) {
            console.error('. Error buscando en historial del chatbot:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar en el historial'
            });
        }
    }

    /**
     * Obtener estadísticas
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const usuarioId = req.usuario.id;
            const estadisticas = await ChatbotModel.obtenerEstadisticas(usuarioId);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('. Error obteniendo estadísticas del chatbot:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las estadísticas'
            });
        }
    }

    /**
     * Eliminar historial
     */
    static async eliminarHistorial(req, res) {
        try {
            const usuarioId = req.usuario.id;
            const { interaccionIds } = req.body; // Array opcional de IDs específicos

            const resultado = await ChatbotModel.eliminarInteracciones(usuarioId, interaccionIds);

            res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            console.error('. Error eliminando historial del chatbot:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el historial'
            });
        }
    }

    /**
     * Endpoint de salud del chatbot
     */
    static async healthCheck(req, res) {
        try {
            const healthStatus = await ChatbotModel.healthCheck();
            
            res.json({
                success: true,
                message: 'Chatbot funcionando correctamente',
                data: healthStatus
            });

        } catch (error) {
            console.error('. Health check del chatbot falló:', error);
            res.status(503).json({
                success: false,
                message: 'Chatbot temporalmente no disponible',
                error: error.message
            });
        }
    }
}

module.exports = ChatbotController;