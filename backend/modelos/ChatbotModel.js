const { supabase } = require('../config/conexion');
const geminiService = require('../servicios/GeminiService');

class ChatbotModel {
    
    /**
     * Registrar interacción del chatbot
     */
    static async registrarInteraccion(usuarioId, pregunta, respuesta) {
        try {
            const interaccionData = {
                usuario_id: usuarioId,
                pregunta: pregunta.trim(),
                respuesta: respuesta.trim(),
                sentimiento: this.analizarSentimientoBasico(pregunta),
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('chatbot_interacciones')
                .insert([interaccionData])
                .select()
                .single();

            if (error) {
                console.warn('. Error registrando interacción del chatbot:', error);
                throw error;
            }

            return data;

        } catch (error) {
            console.warn('. Error en ChatbotModel.registrarInteraccion:', error);
            throw error;
        }
    }

    /**
     * Obtener historial de conversaciones
     */
    static async obtenerHistorial(usuarioId, limit = 20, offset = 0) {
        try {
            const { data: interacciones, error, count } = await supabase
                .from('chatbot_interacciones')
                .select('*', { count: 'exact' })
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: false })
                .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

            if (error) throw error;

            return {
                interacciones: interacciones || [],
                total: count || 0,
                paginaActual: Math.floor(offset / limit) + 1,
                totalPaginas: Math.ceil((count || 0) / limit)
            };

        } catch (error) {
            console.error('. Error obteniendo historial del chatbot:', error);
            throw error;
        }
    }

    /**
     * Buscar en historial por palabras clave
     */
    static async buscarEnHistorial(usuarioId, query, limit = 10) {
        try {
            const { data: interacciones, error } = await supabase
                .from('chatbot_interacciones')
                .select('*')
                .eq('usuario_id', usuarioId)
                .or(`pregunta.ilike.%${query}%,respuesta.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return interacciones || [];

        } catch (error) {
            console.error('. Error buscando en historial del chatbot:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de uso del chatbot
     */
    static async obtenerEstadisticas(usuarioId = null) {
        try {
            let query = supabase
                .from('chatbot_interacciones')
                .select('*', { count: 'exact', head: true });

            // Si se proporciona un usuario, filtrar por él
            if (usuarioId) {
                query = query.eq('usuario_id', usuarioId);
            }

            const { count: totalInteracciones, error: countError } = await query;
            
            if (countError) throw countError;

            // Obtener sentimientos más comunes
            const { data: sentimientos, error: sentimientosError } = await supabase
                .from('chatbot_interacciones')
                .select('sentimiento')
                .eq(usuarioId ? 'usuario_id' : 'sentimiento', usuarioId || 'sentimiento')
                .group('sentimiento')
                .select('sentimiento, count');

            if (sentimientosError) throw sentimientosError;

            // Obtener interacciones del último mes
            const ultimoMes = new Date();
            ultimoMes.setMonth(ultimoMes.getMonth() - 1);

            const { data: actividadReciente, error: actividadError } = await supabase
                .from('chatbot_interacciones')
                .select('created_at')
                .gte('created_at', ultimoMes.toISOString())
                .eq(usuarioId ? 'usuario_id' : 'created_at', usuarioId || 'created_at');

            if (actividadError) throw actividadError;

            return {
                totalInteracciones: totalInteracciones || 0,
                sentimientos: sentimientos || [],
                actividadUltimoMes: actividadReciente?.length || 0,
                promedioDiario: Math.round((actividadReciente?.length || 0) / 30)
            };

        } catch (error) {
            console.error('. Error obteniendo estadísticas del chatbot:', error);
            throw error;
        }
    }

    /**
     * Eliminar interacciones del historial
     */
    static async eliminarInteracciones(usuarioId, interaccionIds = []) {
        try {
            let query = supabase
                .from('chatbot_interacciones')
                .delete()
                .eq('usuario_id', usuarioId);

            // Si se proporcionan IDs específicos, eliminar solo esos
            if (interaccionIds.length > 0) {
                query = query.in('id', interaccionIds);
            }

            const { data, error } = await query;

            if (error) throw error;

            return {
                eliminadas: data?.length || 0,
                mensaje: interaccionIds.length > 0 
                    ? `${interaccionIds.length} interacciones eliminadas`
                    : 'Todo el historial eliminado'
            };

        } catch (error) {
            console.error('. Error eliminando interacciones del chatbot:', error);
            throw error;
        }
    }

    /**
     * Procesar mensaje y generar respuesta
     */
    static async procesarMensaje(mensaje, usuario = null) {
        try {
            // Validaciones básicas
            if (!mensaje || mensaje.trim().length === 0) {
                throw new Error('El mensaje no puede estar vacío');
            }

            if (mensaje.length > 1000) {
                throw new Error('El mensaje es demasiado largo (máximo 1000 caracteres)');
            }

            // Generar respuesta usando Gemini
            const respuesta = await geminiService.generarRespuesta(mensaje, usuario);

            // Registrar la interacción si el usuario está autenticado
            let interaccionRegistrada = null;
            if (usuario?.id) {
                interaccionRegistrada = await this.registrarInteraccion(usuario.id, mensaje, respuesta);
            }

            return {
                respuesta,
                interaccionId: interaccionRegistrada?.id || null,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('. Error en ChatbotModel.procesarMensaje:', error);
            throw error;
        }
    }

    /**
     * Análisis básico de sentimiento (puedes mejorarlo o usar el de GeminiService)
     */
    static analizarSentimientoBasico(texto) {
        if (!texto) return 'neutro';

        const textoLower = texto.toLowerCase();
        
        const palabrasPositivas = ['gracias', 'excelente', 'bueno', 'genial', 'perfecto', 'ayuda', 'por favor'];
        const palabrasNegativas = ['mal', 'terrible', 'horrible', 'error', 'problema', 'queja', 'reclamo'];

        const positivas = palabrasPositivas.filter(palabra => textoLower.includes(palabra)).length;
        const negativas = palabrasNegativas.filter(palabra => textoLower.includes(palabra)).length;

        if (positivas > negativas) return 'positivo';
        if (negativas > positivas) return 'negativo';
        return 'neutro';
    }

    /**
     * Health check del modelo
     */
    static async healthCheck() {
        try {
            // Probar conexión a la base de datos
            const { data: testData, error: dbError } = await supabase
                .from('chatbot_interacciones')
                .select('count')
                .limit(1);

            // Probar servicio Gemini
            const testResponse = await geminiService.generarRespuesta('Hola', null);

            return {
                baseDatos: dbError ? 'error' : 'conectada',
                geminiService: testResponse ? 'activo' : 'inactivo',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('. Health check del ChatbotModel falló:', error);
            throw error;
        }
    }
}

module.exports = ChatbotModel;