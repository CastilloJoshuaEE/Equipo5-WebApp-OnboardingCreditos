// backend/application/use-cases/operador/ObtenerDashboard.js
class ObtenerDashboard {
  constructor(solicitudRepository) {
    this.solicitudRepository = solicitudRepository;
  }

  async execute(operadorId, filtros = {}) {
    const { estado, fecha_desde, fecha_hasta, nivel_riesgo, numero_solicitud, dni } = filtros;

    const solicitudes = await this.solicitudRepository.findByOperador(operadorId, {
      estado,
      fecha_desde,
      fecha_hasta,
      nivel_riesgo,
      numero_solicitud,
      dni
    });

    const metricas = {
      totalSolicitudes: solicitudes.length,
      aprobadas: solicitudes.filter(s => s.estado === 'aprobado').length,
      enRevision: solicitudes.filter(s => s.estado === 'en_revision' || s.estado === 'pendiente_info').length,
      montoDesembolsado: 0,
      listasParaTransferencia: 0
    };

    for (const solicitud of solicitudes) {
      if (solicitud.transferencias_bancarias && solicitud.transferencias_bancarias.length > 0) {
        const transferenciaCompletada = solicitud.transferencias_bancarias
          .find(t => t.estado === 'completada');
        if (transferenciaCompletada) {
          metricas.montoDesembolsado += parseFloat(transferenciaCompletada.monto) || 0;
        }
      }

      if (solicitud.estado === 'aprobado') {
        const tieneContratoFirmado = solicitud.contratos &&
          solicitud.contratos.estado === 'firmado_completo';
        const tieneTransferenciaCompletada = solicitud.transferencias_bancarias &&
          solicitud.transferencias_bancarias.some(t => t.estado === 'completada');

        if (tieneContratoFirmado && !tieneTransferenciaCompletada) {
          metricas.listasParaTransferencia++;
        }
      }
    }

    const estadisticas = {
      total: solicitudes.length,
      en_revision: solicitudes.filter(s => s.estado === 'en_revision').length,
      pendiente_info: solicitudes.filter(s => s.estado === 'pendiente_info').length,
      aprobado: solicitudes.filter(s => s.estado === 'aprobado').length,
      rechazado: solicitudes.filter(s => s.estado === 'rechazado').length
    };

    return {
      success: true,
      data: {
        solicitudes,
        estadisticas,
        metricas,
        total: solicitudes.length
      }
    };
  }
}

module.exports = ObtenerDashboard;