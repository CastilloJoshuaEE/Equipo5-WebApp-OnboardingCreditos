const { supabase } = require('../config/conexion');

class SolicitudModel {
  // Crear solicitud
  static async create(solicitudData) {
    const { data, error } = await supabase
      .from('solicitudes_credito')
      .insert([solicitudData])
      .select();
    
    if (error) throw new Error(`Error creando solicitud: ${error.message}`);
    return data[0];
  }

  // Obtener solicitud por ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('solicitudes_credito')
      .select(`
        *,
        solicitantes: solicitantes!solicitante_id (
          nombre_empresa,
          representante_legal,
          cuit,
          domicilio,
          tipo
        ),
        operadores: operadores!operador_id (
          nivel,
          usuarios: usuarios(nombre_completo)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw new Error('Solicitud no encontrada');
    return data;
  }

  // Obtener solicitudes por solicitante
  static async findBySolicitanteId(solicitanteId) {
    const { data, error } = await supabase
      .from('solicitudes_credito')
      .select('*')
      .eq('solicitante_id', solicitanteId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Error obteniendo solicitudes: ${error.message}`);
    return data;
  }

  // Obtener todas las solicitudes (para operadores)
  static async findAll(filtros = {}) {
    let query = supabase
      .from('solicitudes_credito')
      .select(`
        *,
        solicitantes: solicitantes!solicitante_id (
          nombre_empresa,
          representante_legal,
          cuit
        ),
        operadores: operadores!operador_id (
          nivel
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    }
    if (filtros.nivel_riesgo) {
      query = query.eq('nivel_riesgo', filtros.nivel_riesgo);
    }
    if (filtros.page && filtros.limit) {
      const from = (filtros.page - 1) * filtros.limit;
      const to = from + filtros.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    
    if (error) throw new Error(`Error obteniendo solicitudes: ${error.message}`);
    
    return {
      data,
      total: count
    };
  }

  // Actualizar solicitud
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('solicitudes_credito')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw new Error(`Error actualizando solicitud: ${error.message}`);
    return data[0];
  }

  // Cambiar estado de solicitud
  static async cambiarEstado(id, estado, datosAdicionales = {}) {
    const updates = {
      estado,
      updated_at: new Date().toISOString(),
      ...datosAdicionales
    };

    if (estado === 'enviado') {
      updates.fecha_envio = new Date().toISOString();
    } else if (['aprobado', 'rechazado'].includes(estado)) {
      updates.fecha_decision = new Date().toISOString();
    }

    return await this.update(id, updates);
  }

  // Asignar operador
  static async asignarOperador(id, operadorId) {
    return await this.update(id, {
      operador_id: operadorId,
      estado: 'en_revision',
      updated_at: new Date().toISOString()
    });
  }

  // Obtener estadísticas
  static async getEstadisticas() {
    const { data: conteoPorEstado, error: errorEstado } = await supabase
      .from('solicitudes_credito')
      .select('estado', { count: 'exact' })
      .group('estado');

    const { data: conteoPorRiesgo, error: errorRiesgo } = await supabase
      .from('solicitudes_credito')
      .select('nivel_riesgo', { count: 'exact' })
      .group('nivel_riesgo');

    const { data: montoTotal, error: errorMonto } = await supabase
      .from('solicitudes_credito')
      .select('monto')
      .eq('estado', 'aprobado');

    if (errorEstado || errorRiesgo || errorMonto) {
      throw new Error('Error obteniendo estadísticas');
    }

    const totalAprobado = montoTotal.reduce((sum, solicitud) => sum + parseFloat(solicitud.monto), 0);

    return {
      totalSolicitudes: conteoPorEstado.reduce((sum, item) => sum + item.count, 0),
      porEstado: conteoPorEstado.reduce((acc, item) => {
        acc[item.estado] = item.count;
        return acc;
      }, {}),
      porRiesgo: conteoPorRiesgo.reduce((acc, item) => {
        acc[item.nivel_riesgo] = item.count;
        return acc;
      }, {}),
      montoTotalAprobado: totalAprobado
    };
  }

  // Verificar si el solicitante tiene permiso para ver la solicitud
  static async verificarPermiso(solicitudId, usuarioId, rol) {
    if (rol === 'operador') return true;

    const solicitud = await this.findById(solicitudId);
    return solicitud.solicitante_id === usuarioId;
  }
}

module.exports = SolicitudModel;