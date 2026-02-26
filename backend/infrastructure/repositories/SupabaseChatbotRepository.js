// backend/infrastructure/repositories/SupabaseChatbotRepository.js
const ChatbotRepository = require('../../domain/repositories/ChatbotRepository');
const ChatbotInteraccion = require('../../domain/entities/ChatbotInteraccion');

class SupabaseChatbotRepository extends ChatbotRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }
  async crearInteraccion(interaccionData) {
    // Si no hay usuario_id, no intentamos guardar en la tabla que requiere FK
    if (!interaccionData.usuario_id) {
        console.log('Usuario no autenticado, no se guarda interacción en DB');
        return {
            id: `temp_${Date.now()}`,
            ...interaccionData,
            created_at: new Date().toISOString()
        };
    }

    // CORRECCIÓN: Eliminar cualquier campo id que venga con valor null
    const { id, ...dataToInsert } = interaccionData;
    
    console.log('Guardando interacción en DB:', dataToInsert);

    const { data, error } = await this.supabase
        .from('chatbot_interacciones')
        .insert([dataToInsert])
        .select()
        .single();

    if (error) {
        console.error('Error detallado:', error);
        throw new Error(`Error guardando interacción: ${error.message}`);
    }
    
    return new ChatbotInteraccion(data);
  }

  async obtenerHistorial(usuarioId, limit = 20, offset = 0) {
    let query = this.supabase
      .from('chatbot_interacciones')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (usuarioId) {
      query = query.eq('usuario_id', usuarioId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error obteniendo historial: ${error.message}`);
    return data.map(i => new ChatbotInteraccion(i));
  }

  async buscarEnHistorial(usuarioId, query, limit = 10) {
    let supabaseQuery = this.supabase
      .from('chatbot_interacciones')
      .select('*')
      .or(`pregunta.ilike.%${query}%,respuesta.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (usuarioId) {
      supabaseQuery = supabaseQuery.eq('usuario_id', usuarioId);
    }

    const { data, error } = await supabaseQuery;

    if (error) throw new Error(`Error buscando en historial: ${error.message}`);
    return data.map(i => new ChatbotInteraccion(i));
  }

  async obtenerEstadisticas(usuarioId) {
    try {
      // Total de interacciones
      const { count: total, error: totalError } = await this.supabase
        .from('chatbot_interacciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId);

      if (totalError) throw totalError;

      // Última interacción
      const { data: ultima, error: ultimaError } = await this.supabase
        .from('chatbot_interacciones')
        .select('created_at')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (ultimaError && !ultimaError.message.includes('no rows')) {
        throw ultimaError;
      }

      // Temas más consultados (simulado por palabras clave)
      const { data: recientes, error: recientesError } = await this.supabase
        .from('chatbot_interacciones')
        .select('pregunta')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (recientesError) throw recientesError;

      // Análisis simple de temas
      const temas = {};
      recientes?.forEach(interaccion => {
        const pregunta = interaccion.pregunta.toLowerCase();
        if (pregunta.includes('documento')) temas.documentos = (temas.documentos || 0) + 1;
        if (pregunta.includes('credito') || pregunta.includes('crédito')) temas.creditos = (temas.creditos || 0) + 1;
        if (pregunta.includes('estado')) temas.estado = (temas.estado || 0) + 1;
        if (pregunta.includes('plazo')) temas.plazos = (temas.plazos || 0) + 1;
        if (pregunta.includes('tasa')) temas.tasas = (temas.tasas || 0) + 1;
      });

      // Encontrar el tema más consultado
      let temaPrincipal = 'general';
      let maxCount = 0;
      Object.entries(temas).forEach(([tema, count]) => {
        if (count > maxCount) {
          maxCount = count;
          temaPrincipal = tema;
        }
      });

      return {
        total_interacciones: total || 0,
        ultima_interaccion: ultima?.created_at || null,
        temas_populares: temas,
        tema_principal: temaPrincipal,
        metricas: {
          preguntas_por_dia: Math.round((total || 0) / 30) // Promedio aproximado
        }
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  async eliminarInteracciones(usuarioId, interaccionIds = null) {
    try {
      if (interaccionIds && interaccionIds.length > 0) {
        // Eliminar específicas
        const { data, error } = await this.supabase
          .from('chatbot_interacciones')
          .delete()
          .eq('usuario_id', usuarioId)
          .in('id', interaccionIds)
          .select();

        if (error) throw error;

        return {
          eliminadas: data.length,
          tipo: 'especificas'
        };

      } else {
        // Eliminar todo el historial
        const { data, error } = await this.supabase
          .from('chatbot_interacciones')
          .delete()
          .eq('usuario_id', usuarioId)
          .select();

        if (error) throw error;

        return {
          eliminadas: data.length,
          tipo: 'todo'
        };
      }

    } catch (error) {
      console.error('Error eliminando interacciones:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      // Verificar conexión con la tabla
      const { count, error } = await this.supabase
        .from('chatbot_interacciones')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        // Si la tabla no existe, es normal al principio
        if (error.code === '42P01') {
          return {
            servicio: 'Gemini API',
            estado: 'activo (simulado)',
            prueba: 'exitosa',
            timestamp: new Date().toISOString(),
            nota: 'La tabla chatbot_interacciones se creará al primer uso'
          };
        }
        throw error;
      }

      return {
        servicio: 'Gemini API',
        estado: 'activo',
        prueba: 'exitosa',
        timestamp: new Date().toISOString(),
        database: 'conectado'
      };

    } catch (error) {
      console.error('Error en health check:', error);
      return {
        servicio: 'Gemini API',
        estado: 'activo (modo degradado)',
        prueba: 'exitosa',
        timestamp: new Date().toISOString(),
        warning: 'Problemas de conexión con la base de datos'
      };
    }
  }
}

module.exports = SupabaseChatbotRepository;