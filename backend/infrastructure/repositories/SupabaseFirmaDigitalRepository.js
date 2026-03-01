// backend/infrastructure/repositories/SupabaseFirmaDigitalRepository.js
const FirmaDigitalRepository = require('../../domain/repositories/FirmaDigitalRepository');
const FirmaDigital = require('../../domain/entities/FirmaDigital');
class SupabaseFirmaDigitalRepository extends FirmaDigitalRepository{
    constructor(supabase){
        super();
        this.supabase = supabase;
    }
    async crear(firmaData){
        const { data, error} = await this.supabase
            .from('firmas_digitales')
            .insert([firmaData])
            .select()
            .single();
        if(error) throw new Error(`Error creando firma: ${error.message}`);
        return new FirmaDigital(data);
    }
    async actualizar(id, updateData){
        const { data, error} = await this.supabase
            .from('firmas_digitales')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if(error) throw new Error(`Error actualizando firma: ${error.message}`);
        return new FirmaDigital(data);
    }
    async obtenerPorId(id){
        const { data, error}= await this.supabase
            .from('firmas_digitales')
            .select(`
                *,
                contratos (
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
                )
            `)
            .eq('id', id)
            .single();
        if(error) return null;
        return data;
    }
    async obtenerPorSolicitud(solicitudId){
        const { data, error} = await this.supabase
            .from('firmas_digitales')
            .select('*')
            .eq('solicitud_id', solicitudId)
            .order('created_at', { ascending: false})
            .limit(1)
            .maybeSingle();
        if(error && error.code !== 'PGRST116') throw error;
        return data? new FirmaDigital(data) : null;
    }
async obtenerInfoParaFirma(firmaId) {
  const { data, error } = await this.supabase
    .from('firmas_digitales')
    .select(`
      id,
      estado,
      fecha_expiracion,
      hash_documento_original,
      contrato_id,
      solicitud_id,
      url_documento_firmado,
      ruta_documento,  
      contratos (
        id,
        ruta_documento,
        solicitud_id,
        numero_contrato,
        estado
      ),
      solicitudes_credito (
        numero_solicitud,
        solicitante_id,
        operador_id
      )
    `)
    .eq('id', firmaId)
    .single();

  if (error) return null;
  return data;
}
  async obtenerPendientesPorUsuario(usuarioId, usuarioRol) {
    let query = this.supabase
      .from('firmas_digitales')
      .select(`
        *,
        contratos(*),
        solicitudes_credito(
          numero_solicitud,
          monto,
          solicitante_id,
          operador_id,
          solicitantes: solicitantes!solicitante_id(
            usuarios(*)
          )
        )
      `)
      .in('estado', ['enviado', 'firmado_solicitante', 'firmado_operador'])
      .order('fecha_envio', { ascending: true });

    if (usuarioRol === 'solicitante') {
      query = query.eq('solicitudes_credito.solicitante_id', usuarioId);
    } else if (usuarioRol === 'operador') {
      query = query.eq('solicitudes_credito.operador_id', usuarioId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error obteniendo firmas pendientes: ${error.message}`);
    return data.map(f => new FirmaDigital(f));
  }

  async verificarFirmaActiva(solicitudId) {
    const { data, error } = await this.supabase
      .from('firmas_digitales')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .in('estado', ['pendiente', 'enviado', 'firmado_solicitante', 'firmado_operador'])
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? new FirmaDigital(data) : null;
  }

  async verificarPermisos(firmaId, usuarioId, usuarioRol) {
    try {
      const firma = await this.obtenerPorId(firmaId);
      if (!firma) return false;

      const { data: solicitud, error } = await this.supabase
        .from('solicitudes_credito')
        .select('solicitante_id, operador_id')
        .eq('id', firma.solicitud_id)
        .single();

      if (error || !solicitud) return false;

      if (usuarioRol === 'solicitante') {
        return solicitud.solicitante_id === usuarioId;
      } else if (usuarioRol === 'operador') {
        return true; // Cualquier operador puede acceder
      }

      return false;
    } catch (error) {
      console.error('Error en verificarPermisos:', error);
      return false;
    }
  }

  async verificarPuedeReiniciar(firmaId) {
    try {
      const firma = await this.obtenerPorId(firmaId);
      if (!firma) return true;

      const tiempoTranscurrido = Date.now() - new Date(firma.created_at).getTime();
      const minutosTranscurridos = tiempoTranscurrido / (1000 * 60);

      if (minutosTranscurridos > 30 || (firma.intentos_envio || 0) < 3) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error en verificarPuedeReiniciar:', error);
      return true;
    }
  }

  async renovarFirmaExpirada(firmaId) {
    const updateData = {
      estado: 'enviado',
      fecha_envio: new Date().toISOString(),
      fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      intentos_envio: this.supabase.raw('intentos_envio + 1'),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('firmas_digitales')
      .update(updateData)
      .eq('id', firmaId)
      .select()
      .single();

    if (error) throw new Error(`Error renovando firma: ${error.message}`);
    return new FirmaDigital(data);
  }

  async repararRelacionFirmaContrato(firmaId) {
    const firma = await this.obtenerPorId(firmaId);
    if (!firma) {
      throw new Error('Firma no encontrada');
    }

    const { data: contrato, error: contratoError } = await this.supabase
      .from('contratos')
      .select('*')
      .eq('solicitud_id', firma.solicitud_id)
      .single();

    if (contratoError || !contrato) {
      throw new Error('No se encontró contrato para esta solicitud');
    }

    const { data: firmaActualizada, error: updateError } = await this.supabase
      .from('firmas_digitales')
      .update({
        contrato_id: contrato.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', firmaId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { firma: firmaActualizada, contrato };
  }

  async actualizarUrlsFirma(firmaId, urlsFirma) {
    const updateData = {
      url_firma_solicitante: urlsFirma.solicitante,
      url_firma_operador: urlsFirma.operador,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('firmas_digitales')
      .update(updateData)
      .eq('id', firmaId)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando URLs: ${error.message}`);
    return new FirmaDigital(data);
  }

  async obtenerAuditoria(firmaId) {
    const { data, error } = await this.supabase
      .from('auditoria_firmas')
      .select(`
        *,
        usuarios: usuario_id(
          nombre_completo,
          email
        )
      `)
      .eq('firma_id', firmaId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo auditoría: ${error.message}`);
    return data || [];
  }

  async registrarAuditoria(auditoriaData) {
    const { data, error } = await this.supabase
      .from('auditoria_firmas')
      .insert([auditoriaData])
      .select()
      .single();

    if (error) throw new Error(`Error registrando auditoría: ${error.message}`);
    return data;
  }

  async obtenerEstadisticas(usuarioId = null, usuarioRol = null) {
    let query = this.supabase
      .from('firmas_digitales')
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
    const estados = ['pendiente', 'enviado', 'firmado_solicitante', 'firmado_operador', 'firmado_completo', 'expirado'];

    for (const estado of estados) {
      let estadoQuery = this.supabase
        .from('firmas_digitales')
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

module.exports = SupabaseFirmaDigitalRepository;