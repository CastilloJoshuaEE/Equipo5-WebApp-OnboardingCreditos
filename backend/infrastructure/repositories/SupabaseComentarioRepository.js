// backend/infrastructure/repositories/SupabaseComentarioRepository.js
const ComentarioRepository = require('../../domain/repositories/ComentarioRepository');
const Comentario = require('../../domain/entities/Comentario');

class SupabaseComentarioRepository extends ComentarioRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async crear(comentarioData) {
    const { data, error } = await this.supabase
      .from('comentarios_solicitud')
      .insert([comentarioData])
      .select()
      .single();

    if (error) throw new Error(`Error creando comentario: ${error.message}`);
    return new Comentario(data);
  }

  async obtenerPorSolicitud(solicitudId, filtros = {}) {
    const { tipo, limit = 50, offset = 0 } = filtros;

    let query = this.supabase
      .from('comentarios_solicitud')
      .select(`
        *,
        usuarios:usuario_id(
          nombre_completo,
          email,
          rol
        )
      `)
      .eq('solicitud_id', solicitudId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error obteniendo comentarios: ${error.message}`);
    return data.map(c => new Comentario(c));
  }

  async obtenerPorId(id) {
    const { data, error } = await this.supabase
      .from('comentarios_solicitud')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error obteniendo comentario: ${error.message}`);
    return new Comentario(data);
  }

  async marcarComoLeidos(solicitudId, usuarioId) {
    const { error } = await this.supabase
      .from('comentarios_solicitud')
      .update({ 
        leido: true,
        updated_at: new Date().toISOString()
      })
      .eq('solicitud_id', solicitudId)
      .eq('leido', false)
      .neq('usuario_id', usuarioId);

    if (error) {
      console.error('. Error marcando comentarios como leídos:', error);
      return false;
    }

    return true;
  }

  async obtenerContadorNoLeidos(usuarioId) {
    try {
      // Obtener IDs de solicitudes del usuario
      const { data: solicitudes, error: solicitudesError } = await this.supabase
        .from('solicitudes_credito')
        .select('id')
        .or(`solicitante_id.eq.${usuarioId},operador_id.eq.${usuarioId}`);

      if (solicitudesError) throw solicitudesError;

      if (!solicitudes || solicitudes.length === 0) {
        return 0;
      }

      const solicitudIds = solicitudes.map(s => s.id);

      const { count, error } = await this.supabase
        .from('comentarios_solicitud')
        .select('*', { count: 'exact', head: true })
        .eq('leido', false)
        .neq('usuario_id', usuarioId)
        .in('solicitud_id', solicitudIds);

      if (error) throw error;
      return count || 0;

    } catch (error) {
      console.error('Error en obtenerContadorNoLeidos:', error);
      throw error;
    }
  }

  async eliminar(id) {
    const { error } = await this.supabase
      .from('comentarios_solicitud')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Error eliminando comentario: ${error.message}`);
    return true;
  }

  async verificarPermisos(comentarioId, usuarioId, usuarioRol) {
    try {
      const comentario = await this.obtenerPorId(comentarioId);
      if (!comentario) return false;

      // El autor siempre tiene permisos
      if (comentario.usuario_id === usuarioId) return true;

      // Los operadores tienen permisos sobre todos los comentarios
      if (usuarioRol === 'operador') return true;

      return false;

    } catch (error) {
      console.error('Error en verificarPermisos:', error);
      return false;
    }
  }

  async verificarPermisosSolicitud(solicitudId, usuarioId, usuarioRol) {
    try {
      const { data: solicitud, error } = await this.supabase
        .from('solicitudes_credito')
        .select('solicitante_id, operador_id')
        .eq('id', solicitudId)
        .single();

      if (error || !solicitud) return false;

      // Solicitante solo puede acceder a sus propias solicitudes
      if (usuarioRol === 'solicitante' && solicitud.solicitante_id !== usuarioId) {
        return false;
      }

      // Operador solo puede acceder a solicitudes asignadas
      if (usuarioRol === 'operador' && solicitud.operador_id !== usuarioId) {
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error en verificarPermisosSolicitud:', error);
      return false;
    }
  }

  async obtenerEstadisticas(usuarioId, usuarioRol) {
    try {
      let query = this.supabase
        .from('comentarios_solicitud')
        .select('*', { count: 'exact', head: true });

      // Filtrar por solicitudes del usuario
      if (usuarioRol === 'solicitante') {
        const { data: solicitudes } = await this.supabase
          .from('solicitudes_credito')
          .select('id')
          .eq('solicitante_id', usuarioId);

        if (solicitudes && solicitudes.length > 0) {
          query = query.in('solicitud_id', solicitudes.map(s => s.id));
        } else {
          return { total: 0, no_leidos: 0 };
        }
      } else if (usuarioRol === 'operador') {
        const { data: solicitudes } = await this.supabase
          .from('solicitudes_credito')
          .select('id')
          .eq('operador_id', usuarioId);

        if (solicitudes && solicitudes.length > 0) {
          query = query.in('solicitud_id', solicitudes.map(s => s.id));
        } else {
          return { total: 0, no_leidos: 0 };
        }
      }

      const { count: total, error: totalError } = await query;
      if (totalError) throw totalError;

      // Contar no leídos
      const noLeidos = await this.obtenerContadorNoLeidos(usuarioId);

      return {
        total: total || 0,
        no_leidos: noLeidos
      };

    } catch (error) {
      console.error('Error en obtenerEstadisticas:', error);
      throw error;
    }
  }

  async buscar(texto, usuarioId, usuarioRol, limit = 20) {
    try {
      // Obtener IDs de solicitudes accesibles
      let solicitudIds = [];
      
      if (usuarioRol === 'solicitante') {
        const { data: solicitudes } = await this.supabase
          .from('solicitudes_credito')
          .select('id')
          .eq('solicitante_id', usuarioId);
        solicitudIds = solicitudes?.map(s => s.id) || [];
      } else if (usuarioRol === 'operador') {
        const { data: solicitudes } = await this.supabase
          .from('solicitudes_credito')
          .select('id')
          .eq('operador_id', usuarioId);
        solicitudIds = solicitudes?.map(s => s.id) || [];
      }

      if (solicitudIds.length === 0) {
        return [];
      }

      const { data: comentarios, error } = await this.supabase
        .from('comentarios_solicitud')
        .select(`
          *,
          usuarios:usuario_id(
            nombre_completo,
            email,
            rol
          ),
          solicitudes_credito(
            numero_solicitud,
            estado
          )
        `)
        .ilike('comentario', `%${texto}%`)
        .in('solicitud_id', solicitudIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return comentarios || [];

    } catch (error) {
      console.error('Error en buscar:', error);
      throw error;
    }
  }
}

module.exports = SupabaseComentarioRepository;
