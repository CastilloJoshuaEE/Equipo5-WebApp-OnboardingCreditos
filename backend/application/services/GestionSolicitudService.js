// backend/application/use-cases/operador/ValidarDocumento.js
class GestionSolicitudService {
  constructor(
    crearSolicitudUseCase,
    aprobarSolicitudUseCase,
    obtenerSolicitudesUseCase,
    notificacionService
  ) {
    this.crearSolicitud = crearSolicitudUseCase;
    this.aprobarSolicitud = aprobarSolicitudUseCase;
    this.obtenerSolicitudes = obtenerSolicitudesUseCase;
    this.notificacionService = notificacionService;
  }

  async procesarSolicitudCompleta(solicitudData) {
    // Crear la solicitud
    const resultado = await this.crearSolicitud.execute(solicitudData);

    if (resultado.success) {
      // Enviar notificaciones
      await this.notificacionService.enviarNotificacionNuevaSolicitud(
        resultado.data.solicitud
      );
    }

    return resultado;
  }

  async revisarYAprobarSolicitud(solicitudId, operadorId, datosRevision) {
    // Iniciar revisión
    const resultadoRevision = await this.iniciarRevisionSolicitud.execute(
      solicitudId,
      operadorId
    );

    if (!resultadoRevision.success) {
      return resultadoRevision;
    }

    // Validar documentos
    for (const doc of datosRevision.documentos) {
      await this.validarDocumento.execute(
        solicitudId,
        doc.id,
        operadorId,
        doc
      );
    }

    // Aprobar solicitud
    return await this.aprobarSolicitud.execute(solicitudId, operadorId);
  }

  async obtenerDashboardCompleto(operadorId, filtros) {
    const solicitudes = await this.obtenerSolicitudes.porOperador(operadorId, filtros);
    const metricas = await this.obtenerSolicitudes.metricas(operadorId);
    const estadisticas = await this.obtenerSolicitudes.estadisticas(operadorId);

    return {
      solicitudes,
      metricas,
      estadisticas
    };
  }
}

module.exports = GestionSolicitudService;