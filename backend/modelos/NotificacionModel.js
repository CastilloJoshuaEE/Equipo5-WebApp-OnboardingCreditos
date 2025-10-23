// models/NotificacionModel.js
const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');

class NotificacionModel {
  // Obtener notificaciones por usuario
  static async obtenerPorUsuario(usuarioId, filtros = {}) {
    const { limit = 10, offset = 0, leida } = filtros;

    let query = supabase
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });

    if (leida !== undefined) {
      query = query.eq('leida', leida);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  // Obtener contador de notificaciones
  static async obtenerContador(usuarioId, leida = null) {
    let query = supabase
      .from('notificaciones')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId);

    if (leida !== null) {
      query = query.eq('leida', leida);
    }

    const { count, error } = await query;
    
    if (error) throw error;
    return count || 0;
  }

  // Marcar como leída
  static async marcarComoLeida(id, usuarioId) {
    const { data, error } = await supabase
      .from('notificaciones')
      .update({ 
        leida: true,
      })
      .eq('id', id)
      .eq('usuario_id', usuarioId)
      .select();

    if (error) throw error;
    return data?.[0];
  }

  // Marcar todas como leídas
  static async marcarTodasComoLeidas(usuarioId) {
    const { error } = await supabase
      .from('notificaciones')
      .update({ 
        leida: true,
      })
      .eq('usuario_id', usuarioId)
      .eq('leida', false);

    if (error) throw error;
    return true;
  }

  // Crear notificación
  static async crear(notificacionData) {
    const { data, error } = await supabaseAdmin
      .from('notificaciones')
      .insert([notificacionData])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  // Verificar propiedad de notificación
  static async verificarPropiedad(id, usuarioId) {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('usuario_id')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data?.usuario_id === usuarioId;
  }
}

module.exports = NotificacionModel;