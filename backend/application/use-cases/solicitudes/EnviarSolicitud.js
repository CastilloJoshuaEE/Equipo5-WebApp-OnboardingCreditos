// backend/application/use-cases/solicitudes/EnviarSolicitud.js
const Solicitud = require('../../../domain/entities/Solicitud');

class EnviarSolicitud {
  constructor(solicitudRepository, documentoRepository, notificacionService, supabase) {
    this.solicitudRepository = solicitudRepository;
    this.documentoRepository = documentoRepository;
    this.notificacionService = notificacionService;
    this.supabase = supabase;
  }

  async execute(solicitud_id, usuario) {
    const documentosCompletos = await this.documentoRepository.verificarDocumentosObligatorios(solicitud_id);

    // Verificar que documentosFaltantes existe y es un array
    const documentosFaltantes = documentosCompletos.documentos_faltantes || [];
    
    if (!documentosCompletos.completos) {
      return {
        success: false,
        status: 400,
        message: `Documentos obligatorios faltantes: ${documentosFaltantes.join(', ')}`
      };
    }

    const solicitud = await this.solicitudRepository.cambiarEstado(solicitud_id, Solicitud.ESTADOS.ENVIADO);

    await this.calcularNivelRiesgo(solicitud_id);

    const { data: operadorAsignado, error: asignacionError } = await this.supabase
      .rpc('asignar_operador_automatico', { p_solicitud_id: solicitud_id });

    if (asignacionError) {
      console.error('Error asignando operador:', asignacionError);
      throw new Error('No se pudo asignar un operador automáticamente');
    }

    console.log(`Operador asignado: ${operadorAsignado}`);

    const { data: operadorInfo, error: operadorError } = await this.supabase
      .from('operadores')
      .select(`
        id,
        usuarios!inner(nombre_completo, email)
      `)
      .eq('id', operadorAsignado)
      .single();

    if (operadorError) {
      console.error('Error obteniendo información del operador:', operadorError);
    }

    await this.notificacionService.crearNotificacionOperadorAsignado(
      solicitud.solicitante_id,
      solicitud_id,
      operadorInfo
    );

    return {
      success: true,
      message: 'Solicitud enviada exitosamente para revisión',
      data: {
        ...solicitud,
        operador_asignado: operadorAsignado,
        operador_info: operadorInfo ? {
          id: operadorInfo.id,
          nombre: operadorInfo.usuarios?.nombre_completo,
          email: operadorInfo.usuarios?.email
        } : null
      }
    };
  }

  async calcularNivelRiesgo(solicitudId) {
    try {
      const { data: solicitud, error: solError } = await this.supabase
        .from('solicitudes_credito')
        .select('*')
        .eq('id', solicitudId)
        .single();

      if (solError) throw solError;

      const { data: documentos, error: docsError } = await this.supabase
        .from('documentos')
        .select('*')
        .eq('solicitud_id', solicitudId);

      if (docsError) throw docsError;

      let puntajeRiesgo = 50;

      const factores = {
        monto: solicitud.monto > 1000000 ? -10 : 5,
        plazo: solicitud.plazo_meses > 36 ? -5 : 2,
        documentosCompletos: documentos.length >= 3 ? 10 : -15,
        documentosValidados: documentos.filter(d => d.estado === 'validado').length >= 3 ? 15 : -20
      };

      puntajeRiesgo += Object.values(factores).reduce((sum, factor) => sum + factor, 0);

      let nivelRiesgo;
      if (puntajeRiesgo >= 70) nivelRiesgo = Solicitud.NIVELES_RIESGO.BAJO;
      else if (puntajeRiesgo >= 40) nivelRiesgo = Solicitud.NIVELES_RIESGO.MEDIO;
      else nivelRiesgo = Solicitud.NIVELES_RIESGO.ALTO;

      await this.supabase
        .from('solicitudes_credito')
        .update({
          nivel_riesgo: nivelRiesgo,
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitudId);

      console.log(`Nivel de riesgo calculado: ${nivelRiesgo} (puntaje: ${puntajeRiesgo})`);
    } catch (error) {
      console.error('Error calculando nivel de riesgo:', error);
    }
  }
}

module.exports = EnviarSolicitud;