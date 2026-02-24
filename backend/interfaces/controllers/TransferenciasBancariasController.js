// backend/interfaces/controllers/TransferenciasBancariasController.js
class TransferenciasBancariasController {
  constructor(
    verificarHabilitacionTransferenciaUseCase,
    crearTransferenciaUseCase,
    obtenerComprobanteUseCase,
    obtenerHistorialTransferenciasUseCase,
    obtenerMisTransferenciasUseCase,
    forzarActualizacionEstadoUseCase,
    obtenerEstadisticasTransferenciasUseCase,
    simularProcesamientoTransferenciaUseCase,
    generarComprobantePDFUseCase,
    supabase
  ) {
    this._verificarHabilitacionTransferencia = verificarHabilitacionTransferenciaUseCase;
    this._crearTransferencia = crearTransferenciaUseCase;
    this._obtenerComprobante = obtenerComprobanteUseCase;
    this._obtenerHistorialTransferencias = obtenerHistorialTransferenciasUseCase;
    this._obtenerMisTransferencias = obtenerMisTransferenciasUseCase;
    this._forzarActualizacionEstado = forzarActualizacionEstadoUseCase;
    this._obtenerEstadisticasTransferencias = obtenerEstadisticasTransferenciasUseCase;
    this._simularProcesamientoTransferencia = simularProcesamientoTransferenciaUseCase;
    this._generarComprobantePDF = generarComprobantePDFUseCase;
    this.supabase = supabase;
  }

  async verificarHabilitacionTransferencia(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._verificarHabilitacionTransferencia.execute(solicitud_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async crearTransferencia(req, res) {
    const result = await this._crearTransferencia.execute(req.body, req.usuario);
    return res.status(result.status || (result.success ? 201 : 500)).json(result);
  }

  async obtenerComprobante(req, res) {
    const { transferencia_id } = req.params;
    const result = await this._obtenerComprobante.execute(transferencia_id, req.usuario);

    if (!result.success) {
      return res.status(result.status || 500).json(result);
    }

    res.setHeader('Content-Type', result.data.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.nombre_archivo}"`);
    res.send(result.data.buffer);
  }

  async obtenerHistorial(req, res) {
    const result = await this._obtenerHistorialTransferencias.execute(req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerMisTransferencias(req, res) {
    const result = await this._obtenerMisTransferencias.execute(req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async forzarActualizacionEstado(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._forzarActualizacionEstado.execute(solicitud_id, req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerEstadisticas(req, res) {
    const result = await this._obtenerEstadisticasTransferencias.execute(req.usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async verificarFirma(req, res) {
    try {
      const { solicitud_id } = req.params;

      const { data: firma } = await this.supabase
        .from('firmas_digitales')
        .select('*')
        .eq('solicitud_id', solicitud_id)
        .single();

      res.json({
        success: true,
        data: {
          firma: firma,
          puede_transferir: firma?.estado === 'firmado_completo' || firma?.integridad_valida === true
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error verificando firma'
      });
    }
  }
}

module.exports = TransferenciasBancariasController;