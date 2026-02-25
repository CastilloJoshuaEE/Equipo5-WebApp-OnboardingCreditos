// backend/infrastructure/repositories/SupabaseSolicitudRepository.js
const SolicitudRepository = require('../../domain/repositories/SolicitudRepository');
const Solicitud = require('../../domain/entities/Solicitud');

class SupabaseSolicitudRepository extends SolicitudRepository {
  constructor(supabase, supabaseAdmin) {
    super();
    this.supabase = supabase;
    this.supabaseAdmin = supabaseAdmin;
  }

  async create(solicitudData) {
    const { data, error } = await this.supabaseAdmin
      .from('solicitudes_credito')
      .insert([solicitudData])
      .select()
      .single();

    if (error) throw new Error(`Error creando solicitud: ${error.message}`);
    return new Solicitud(data);
  }

  async findById(id) {
    try {
      console.log(` Buscando solicitud con ID: ${id}`);

      const { data, error } = await this.supabaseAdmin
        .from('solicitudes_credito')
        .select(`
          *,
          solicitantes!solicitante_id (
            id,
            nombre_empresa,
            representante_legal,
            cuit,
            domicilio,
            tipo,
            usuarios!inner(
              id,
              nombre_completo,
              email,
              dni,
              telefono
            )
          ),
          operadores!operador_id (
            id,
            nivel,
            usuarios!inner(
              id,
              nombre_completo,
              email
            )
          ),
          contratos(*),
          transferencias_bancarias(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error en consulta de solicitud:', error);
        throw new Error('Solicitud no encontrada');
      }

      if (!data) {
        console.error('Solicitud no encontrada con ID:', id);
        throw new Error('Solicitud no encontrada');
      }

      console.log('Solicitud encontrada:', data.id);
      return data;
    } catch (error) {
      console.error('Error en findById:', error);
      throw new Error('Solicitud no encontrada: ' + error.message);
    }
  }

  async findBySolicitanteId(solicitanteId) {
    const { data, error } = await this.supabase
      .from('solicitudes_credito')
      .select('*')
      .eq('solicitante_id', solicitanteId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo solicitudes: ${error.message}`);
    return data.map(s => new Solicitud(s));
  }
  async findByOperador(operadorId, filtros = {}) {
    let query = this.supabase
      .from('solicitudes_credito')
      .select(`
        *,
        solicitantes!solicitudes_credito_solicitante_id_fkey (
          id,
          nombre_empresa,
          cuit,
          representante_legal,
          domicilio,
          usuarios!solicitantes_id_fkey (
            nombre_completo,
            email,
            telefono,
            dni
          )
        )
      `)
      .eq('operador_id', operadorId);

    // Aplicar filtros si existen
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros.nivel_riesgo) {
      query = query.eq('nivel_riesgo', filtros.nivel_riesgo);
    }

    if (filtros.fecha_desde) {
      query = query.gte('created_at', filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query = query.lte('created_at', filtros.fecha_hasta);
    }

    if (filtros.numero_solicitud) {
      query = query.ilike('numero_solicitud', `%${filtros.numero_solicitud}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data.map(s => new Solicitud(s));
  }
  async findByNumero(numeroSolicitud) {
    const { data, error } = await this.supabase
      .from('solicitudes_credito')
      .select('*')
      .eq('numero_solicitud', numeroSolicitud)
      .maybeSingle();

    if (error) throw error;
    return data ? new Solicitud(data) : null;
  }

  async findAll(filtros = {}) {
    let query = this.supabase
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
      data: data.map(s => new Solicitud(s)),
      total: count
    };
  }

  async update(id, updates) {
    const { data, error } = await this.supabaseAdmin
      .from('solicitudes_credito')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando solicitud: ${error.message}`);
    return new Solicitud(data);
  }

  async cambiarEstado(id, estado, datosAdicionales = {}) {
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

  async asignarOperador(id, operadorId) {
    return await this.update(id, {
      operador_id: operadorId,
      estado: 'en_revision',
      updated_at: new Date().toISOString()
    });
  }

  async getEstadisticas() {
    const { data: conteoPorEstado, error: errorEstado } = await this.supabase
      .from('solicitudes_credito')
      .select('estado', { count: 'exact' });

    const { data: conteoPorRiesgo, error: errorRiesgo } = await this.supabase
      .from('solicitudes_credito')
      .select('nivel_riesgo', { count: 'exact' });

    const { data: montoTotal, error: errorMonto } = await this.supabase
      .from('solicitudes_credito')
      .select('monto')
      .eq('estado', 'aprobado');

    if (errorEstado || errorRiesgo || errorMonto) {
      throw new Error('Error obteniendo estadísticas');
    }

    const conteoPorEstadoAgrupado = {};
    const conteoPorRiesgoAgrupado = {};

    conteoPorEstado.forEach(item => {
      conteoPorEstadoAgrupado[item.estado] = (conteoPorEstadoAgrupado[item.estado] || 0) + 1;
    });

    conteoPorRiesgo.forEach(item => {
      conteoPorRiesgoAgrupado[item.nivel_riesgo] = (conteoPorRiesgoAgrupado[item.nivel_riesgo] || 0) + 1;
    });

    const total = conteoPorEstado.length;
    const totalAprobado = montoTotal.reduce((sum, solicitud) => sum + parseFloat(solicitud.monto), 0);

    return {
      totalSolicitudes: total,
      porEstado: conteoPorEstadoAgrupado,
      porRiesgo: conteoPorRiesgoAgrupado,
      montoTotalAprobado: totalAprobado
    };
  }

  async verificarPermiso(solicitudId, usuarioId, rol) {
    if (rol === 'operador') return true;

    const solicitud = await this.findById(solicitudId);
    return solicitud.solicitante_id === usuarioId;
  }

  async getDocumentos(solicitudId) {
    const { data, error } = await this.supabase
      .from('documentos')
      .select('*')
      .eq('solicitud_id', solicitudId);

    if (error) throw new Error(`Error obteniendo documentos: ${error.message}`);
    return data;
  }

  async getVerificacionesKYC(solicitudId) {
    const { data, error } = await this.supabase
      .from('verificaciones_kyc')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo verificaciones: ${error.message}`);
    return data;
  }

  async getSolicitudCompleta(id) {
    return await this.findById(id);
  }

  async asignarOperadorAutomatico(solicitudId) {
    const { data: operadores, error } = await this.supabase
      .from('operadores')
      .select(`
        id,
        nivel,
        usuarios!inner(nombre_completo, cuenta_activa),
        solicitudes_credito!left(
          id,
          estado
        )
      `)
      .eq('usuarios.cuenta_activa', true)
      .eq('nivel', 'analista');

    if (error) throw error;

    const operadoresConCarga = operadores.map(operador => {
      const solicitudesPendientes = operador.solicitudes_credito?.filter(
        sol => sol.estado === 'en_revision' || sol.estado === 'pendiente_info'
      ) || [];

      return {
        ...operador,
        carga: solicitudesPendientes.length
      };
    });

    operadoresConCarga.sort((a, b) => {
      if (a.carga === b.carga) {
        return Math.random() - 0.5;
      }
      return a.carga - b.carga;
    });

    const operadorAsignado = operadoresConCarga[0]?.id;

    if (!operadorAsignado) {
      throw new Error('No hay operadores disponibles para asignar');
    }

    await this.asignarOperador(solicitudId, operadorAsignado);

    return operadorAsignado;
  }
}

module.exports = SupabaseSolicitudRepository;