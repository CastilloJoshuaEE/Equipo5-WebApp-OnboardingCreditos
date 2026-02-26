// backend/infrastructure/repositories/SupabaseTransferenciaBancariaRepository.js
const TransferenciaBancariaRepository = require('../../domain/repositories/TransferenciaBancariaRepository');
const TransferenciaBancaria = require('../../domain/entities/TransferenciaBancaria');

class SupabaseTransferenciaBancariaRepository extends TransferenciaBancariaRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async crear(transferenciaData) {
    const { data, error } = await this.supabase
      .from('transferencias_bancarias')
      .insert([transferenciaData])
      .select()
      .single();

    if (error) throw new Error(`Error creando transferencia: ${error.message}`);
    return new TransferenciaBancaria(data);
  }

  async obtenerPorId(id) {
    const { data, error } = await this.supabase
      .from('transferencias_bancarias')
      .select(`
        *,
        solicitudes_credito (
          numero_solicitud,
          solicitante_id,
          operador_id,
          monto,
          moneda,
          solicitantes: solicitante_id (
            usuarios (*)
          ),
          operadores: operador_id (
            usuarios (*)
          )
        ),
        contactos_bancarios (*)
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async obtenerPorSolicitud(solicitudId) {
    const { data, error } = await this.supabase
      .from('transferencias_bancarias')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .in('estado', ['pendiente', 'procesando', 'completada'])
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? new TransferenciaBancaria(data) : null;
  }

  async actualizarEstado(id, estado, datosAdicionales = {}) {
    const updateData = {
      estado,
      updated_at: new Date().toISOString(),
      ...datosAdicionales
    };

    const { data, error } = await this.supabase
      .from('transferencias_bancarias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando estado: ${error.message}`);
    return new TransferenciaBancaria(data);
  }

  async actualizarRutaComprobante(id, rutaComprobante) {
    const { data, error } = await this.supabase
      .from('transferencias_bancarias')
      .update({
        ruta_comprobante: rutaComprobante,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando ruta comprobante: ${error.message}`);
    return new TransferenciaBancaria(data);
  }

  async obtenerHistorialPorUsuario(usuarioId, usuarioRol) {
    let query = this.supabase
      .from('transferencias_bancarias')
      .select(`
        *,
        solicitudes_credito (
          numero_solicitud,
          solicitante_id,
          operador_id
        ),
        contactos_bancarios (
          numero_cuenta,
          nombre_banco,
          tipo_cuenta,
          solicitante_id
        )
      `)
      .order('created_at', { ascending: false });

    if (usuarioRol === 'solicitante') {
      query = query.eq('solicitudes_credito.solicitante_id', usuarioId);
    } else if (usuarioRol === 'operador') {
      query = query.eq('solicitudes_credito.operador_id', usuarioId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error obteniendo historial: ${error.message}`);
    return data || [];
  }

  async obtenerTransferenciasSolicitante(solicitanteId) {
    const { data, error } = await this.supabase
      .from('transferencias_bancarias')
      .select(`
        *,
        solicitudes_credito!inner(
          numero_solicitud,
          solicitante_id,
          operador_id
        ),
        contactos_bancarios(
          nombre_banco,
          numero_cuenta,
          tipo_cuenta
        )
      `)
      .eq('solicitudes_credito.solicitante_id', solicitanteId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo transferencias: ${error.message}`);
    return data || [];
  }

  async verificarTransferenciaExistente(solicitudId) {
    const { data, error } = await this.supabase
      .from('transferencias_bancarias')
      .select('id, estado, numero_comprobante')
      .eq('solicitud_id', solicitudId)
      .in('estado', ['pendiente', 'procesando', 'completada'])
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async verificarPermisos(transferenciaId, usuarioId, usuarioRol) {
    try {
      const transferencia = await this.obtenerPorId(transferenciaId);
      if (!transferencia) return false;

      const solicitud = transferencia.solicitudes_credito;
      if (!solicitud) return false;

      if (['admin', 'operador'].includes(usuarioRol)) {
        return true;
      }

      if (usuarioRol === 'solicitante') {
        return solicitud.solicitante_id === usuarioId;
      }

      return false;
    } catch (error) {
      console.error('Error en verificarPermisos:', error);
      return false;
    }
  }

  async obtenerEstadisticas(usuarioId = null, usuarioRol = null) {
    let query = this.supabase
      .from('transferencias_bancarias')
      .select('estado, monto, moneda', { count: 'exact', head: true });

    if (usuarioId && usuarioRol) {
      if (usuarioRol === 'solicitante') {
        query = query.in('solicitud_id',
          this.supabase
            .from('solicitudes_credito')
            .select('id')
            .eq('solicitante_id', usuarioId)
        );
      } else if (usuarioRol === 'operador') {
        query = query.in('solicitud_id',
          this.supabase
            .from('solicitudes_credito')
            .select('id')
            .eq('operador_id', usuarioId)
        );
      }
    }

    const { count: total, error: totalError } = await query;
    if (totalError) throw totalError;

    const estados = ['pendiente', 'procesando', 'completada', 'fallida'];
    const estadisticas = { total: total || 0 };

    for (const estado of estados) {
      let estadoQuery = this.supabase
        .from('transferencias_bancarias')
        .select('*', { count: 'exact', head: true })
        .eq('estado', estado);

      if (usuarioId && usuarioRol) {
        if (usuarioRol === 'solicitante') {
          estadoQuery = estadoQuery.in('solicitud_id',
            this.supabase
              .from('solicitudes_credito')
              .select('id')
              .eq('solicitante_id', usuarioId)
          );
        } else if (usuarioRol === 'operador') {
          estadoQuery = estadoQuery.in('solicitud_id',
            this.supabase
              .from('solicitudes_credito')
              .select('id')
              .eq('operador_id', usuarioId)
          );
        }
      }

      const { count, error } = await estadoQuery;
      if (!error) {
        estadisticas[estado] = count || 0;
      }
    }

    let montoQuery = this.supabase
      .from('transferencias_bancarias')
      .select('monto, moneda')
      .eq('estado', 'completada');

    if (usuarioId && usuarioRol) {
      if (usuarioRol === 'solicitante') {
        montoQuery = montoQuery.in('solicitud_id',
          this.supabase
            .from('solicitudes_credito')
            .select('id')
            .eq('solicitante_id', usuarioId)
        );
      } else if (usuarioRol === 'operador') {
        montoQuery = montoQuery.in('solicitud_id',
          this.supabase
            .from('solicitudes_credito')
            .select('id')
            .eq('operador_id', usuarioId)
        );
      }
    }

    const { data: montos, error: montoError } = await montoQuery;
    if (!montoError && montos) {
      const montoTotalUSD = montos
        .filter(t => t.moneda === 'USD')
        .reduce((sum, t) => sum + (t.monto || 0), 0);

      const montoTotalARS = montos
        .filter(t => t.moneda === 'ARS')
        .reduce((sum, t) => sum + (t.monto || 0), 0);

      estadisticas.monto_total = {        
        USD: montoTotalUSD,
        ARS: montoTotalARS
      };
    }

    return estadisticas;
  }

  async obtenerRecientes(limite = 10) {
    const { data, error } = await this.supabase
      .from('transferencias_bancarias')
      .select(`
        *,
        solicitudes_credito (
          numero_solicitud,
          solicitantes: solicitante_id (
            usuarios (
              nombre_completo
            )
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) throw new Error(`Error obteniendo recientes: ${error.message}`);
    return data || [];
  }

  async verificarEstadoFirma(solicitudId) {
    const { data, error } = await this.supabase
      .from('firmas_digitales')
      .select('estado, fecha_firma_completa, integridad_valida, fecha_firma_solicitante, fecha_firma_operador')
      .eq('solicitud_id', solicitudId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error verificando firma: ${error.message}`);
    return data || [];
  }

  async obtenerSolicitud(solicitudId) {
    const { data, error } = await this.supabase
      .from('solicitudes_credito')
      .select('operador_id, monto, moneda, estado, solicitante_id, numero_solicitud')
      .eq('id', solicitudId)
      .single();

    if (error) throw new Error(`Error obteniendo solicitud: ${error.message}`);
    return data;
  }

  async obtenerContactoBancario(contactoId) {
    const { data, error } = await this.supabase
      .from('contactos_bancarios')
      .select('*, solicitantes: solicitante_id(*)')
      .eq('id', contactoId)
      .single();

    if (error) throw new Error(`Error obteniendo contacto: ${error.message}`);
    return data;
  }

  async obtenerContrato(solicitudId) {
    const { data, error } = await this.supabase
      .from('contratos')
      .select('id')
      .eq('solicitud_id', solicitudId)
      .single();

    if (error) throw new Error(`Error obteniendo contrato: ${error.message}`);
    return data;
  }

  async obtenerInfoComprobante(transferenciaId) {
    const { data, error } = await this.supabase
      .from('transferencias_bancarias')
      .select('ruta_comprobante, numero_comprobante, estado')
      .eq('id', transferenciaId)
      .single();

    if (error) throw new Error(`Error obteniendo info comprobante: ${error.message}`);
    return data;
  }

  async crearNotificaciones(notificacionesData) {
    const { data, error } = await this.supabase
      .from('notificaciones')
      .insert(notificacionesData)
      .select();

    if (error) throw new Error(`Error creando notificaciones: ${error.message}`);
    return data || [];
  }

  async marcarSolicitudComoCerrada(solicitudId) {
    const { error } = await this.supabase
      .from('solicitudes_credito')
      .update({
        estado: 'aprobada',
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitudId);

    if (error) throw new Error(`Error marcando solicitud como cerrada: ${error.message}`);

    await this.supabase
      .from('contratos')
      .update({
        estado: 'cerrado',
        updated_at: new Date().toISOString()
      })
      .eq('solicitud_id', solicitudId);

    return { success: true, message: 'Solicitud marcada como cerrada' };
  }
}

module.exports = SupabaseTransferenciaBancariaRepository;