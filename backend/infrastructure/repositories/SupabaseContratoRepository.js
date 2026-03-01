// backend/infrastructure/repositories/SupabaseContratoRepository.js
const ContratoRepository = require('../../domain/repositories/ContratoRepository');
const Contrato = require('../../domain/entities/Contrato');

class SupabaseContratoRepository extends ContratoRepository {
  constructor(supabase, supabaseAdmin) {
    super();
    this.supabase = supabase;
    this.supabaseAdmin = supabaseAdmin; 
  }

  async crear(contratoData) {
    
    const { data, error } = await this.supabaseAdmin
      .from('contratos')
      .insert([contratoData])
      .select()
      .single();

    if (error) throw new Error(`Error creando contrato: ${error.message}`);
    return new Contrato(data);
  }

  async actualizar(id, updateData) {
  // Primero verificar que existe exactamente un registro
  const { data: existing, error: checkError } = await this.supabaseAdmin
    .from('contratos')
    .select('id')
    .eq('id', id);

  if (checkError) {
    throw new Error(`Error verificando contrato: ${checkError.message}`);
  }

  if (!existing || existing.length === 0) {
    throw new Error(`Contrato con ID ${id} no encontrado`);
  }

  if (existing.length > 1) {
    // Esto no debería pasar con UUID, pero por si acaso
    console.warn(`Múltiples contratos encontrados con ID ${id}. Usando el primero.`);
  }

  // Realizar la actualización
  const { data, error } = await this.supabaseAdmin
    .from('contratos')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    throw new Error(`Error actualizando contrato: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No se pudo obtener el contrato actualizado');
  }

  // Devolver el primer resultado
  return new Contrato(data[0]);
}

  async obtenerPorId(id) {
    const { data, error } = await this.supabase
      .from('contratos')
      .select(`
        *,
        solicitudes_credito(
          *,
          solicitantes(
            usuarios(*),
            nombre_empresa,
            cuit,
            representante_legal,
            domicilio
          ),
          operadores(
            usuarios(*)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async obtenerPorSolicitud(solicitudId) {
    const { data, error } = await this.supabaseAdmin
      .from('contratos')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? new Contrato(data) : null;
  }

  async obtenerPorUsuario(usuarioId, usuarioRol, filtros = {}) {
    let query = this.supabase
      .from('contratos')
      .select(`
        *,
        solicitudes_credito(
          *,
          solicitantes(
            usuarios(*),
            nombre_empresa
          )
        )
      `);

    if (usuarioRol === 'solicitante') {
      const { data: solicitudes } = await this.supabase
        .from('solicitudes_credito')
        .select('id')
        .eq('solicitante_id', usuarioId);

      if (solicitudes && solicitudes.length > 0) {
        query = query.in('solicitud_id', solicitudes.map(s => s.id));
      } else {
        return [];
      }
    } else if (usuarioRol === 'operador') {
      const { data: solicitudes } = await this.supabase
        .from('solicitudes_credito')
        .select('id')
        .eq('operador_id', usuarioId);

      if (solicitudes && solicitudes.length > 0) {
        query = query.in('solicitud_id', solicitudes.map(s => s.id));
      } else {
        return [];
      }
    }

    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw new Error(`Error obteniendo contratos: ${error.message}`);
    return data || [];
  }

  async actualizarRutaDocumento(contratoId, rutaDocumento) {
    const { data, error } = await this.supabaseAdmin
      .from('contratos')
      .update({
        ruta_documento: rutaDocumento,
        updated_at: new Date().toISOString()
      })
      .eq('id', contratoId)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando ruta: ${error.message}`);
    return new Contrato(data);
  }

  async obtenerInformacionFirmas(solicitudId) {
    const { data, error } = await this.supabase
      .from('firmas_digitales')
      .select('fecha_firma_solicitante, fecha_firma_operador, hash_documento_firmado')
      .eq('solicitud_id', solicitudId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async verificarEstadoParaFirma(firmaId) {
    const { data, error } = await this.supabase
      .from('firmas_digitales')
      .select(`
        id,
        estado,
        contratos!inner(
          ruta_documento,
          estado
        )
      `)
      .eq('id', firmaId)
      .single();

    if (error) return null;
    return data;
  }

  async obtenerParaFirma(firmaId) {
    const { data, error } = await this.supabase
      .from('firmas_digitales')
      .select(`
        id,
        ruta_documento,
        contratos!inner(
          ruta_documento,
          solicitud_id,
          estado
        )
      `)
      .eq('id', firmaId)
      .single();

    if (error) return null;
    return data;
  }

  async verificarPermisos(contratoId, usuarioId, usuarioRol) {
    try {
      const contrato = await this.obtenerPorId(contratoId);
      if (!contrato) return false;

      const solicitud = contrato.solicitudes_credito;

      if (usuarioRol === 'solicitante') {
        return solicitud.solicitante_id === usuarioId;
      } else if (usuarioRol === 'operador') {
        return solicitud.operador_id === usuarioId;
      }

      return false;
    } catch (error) {
      console.error('Error en verificarPermisos:', error);
      return false;
    }
  }

  async obtenerEstadisticas(usuarioId = null, usuarioRol = null) {
    let query = this.supabase
      .from('contratos')
      .select('estado', { count: 'exact', head: true });

    if (usuarioId && usuarioRol) {
      if (usuarioRol === 'solicitante') {
        const { data: solicitudes } = await this.supabase
          .from('solicitudes_credito')
          .select('id')
          .eq('solicitante_id', usuarioId);

        if (solicitudes && solicitudes.length > 0) {
          query = query.in('solicitud_id', solicitudes.map(s => s.id));
        } else {
          return { total: 0 };
        }
      } else if (usuarioRol === 'operador') {
        const { data: solicitudes } = await this.supabase
          .from('solicitudes_credito')
          .select('id')
          .eq('operador_id', usuarioId);

        if (solicitudes && solicitudes.length > 0) {
          query = query.in('solicitud_id', solicitudes.map(s => s.id));
        } else {
          return { total: 0 };
        }
      }
    }

    const { count: total, error: totalError } = await query;
    if (totalError) throw totalError;

    const estadisticas = { total: total || 0 };
    const estados = ['generado', 'pendiente_firma', 'firmado_solicitante', 'firmado_operador', 'firmado_completo', 'vigente'];

    for (const estado of estados) {
      let estadoQuery = this.supabase
        .from('contratos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', estado);

      if (usuarioId && usuarioRol) {
        if (usuarioRol === 'solicitante') {
          const { data: solicitudes } = await this.supabase
            .from('solicitudes_credito')
            .select('id')
            .eq('solicitante_id', usuarioId);

          if (solicitudes && solicitudes.length > 0) {
            estadoQuery = estadoQuery.in('solicitud_id', solicitudes.map(s => s.id));
          }
        } else if (usuarioRol === 'operador') {
          const { data: solicitudes } = await this.supabase
            .from('solicitudes_credito')
            .select('id')
            .eq('operador_id', usuarioId);

          if (solicitudes && solicitudes.length > 0) {
            estadoQuery = estadoQuery.in('solicitud_id', solicitudes.map(s => s.id));
          }
        }
      }

      const { count, error } = await estadoQuery;
      if (!error) {
        estadisticas[estado] = count || 0;
      }
    }

    return estadisticas;
  }
}

module.exports = SupabaseContratoRepository;