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

  // Descarga binaria del comprobante PDF
  async obtenerComprobante(req, res) {
    const transferencia_id = req.params.transferencia_id;
    const result = await this._obtenerComprobante.execute(transferencia_id, req.usuario);

    if (!result.success) {
      return res.status(result.status || 500).json(result);
    }

    res.setHeader('Content-Type', result.data.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.nombre_archivo}"`);
    res.setHeader('Content-Length', result.data.buffer.length);
    res.send(result.data.buffer);
  }

  // Vista previa: retorna URL pública del comprobante
  async verComprobante(req, res) {
    try {
      const { transferencia_id } = req.params;
      const usuario = req.usuario;

      const { data: transferencia, error } = await this.supabase
        .from('transferencias_bancarias')
        .select(`
          id,
          ruta_comprobante,
          numero_comprobante,
          estado,
          solicitudes_credito(solicitante_id, operador_id)
        `)
        .eq('id', transferencia_id)
        .single();

      if (error || !transferencia) {
        return res.status(404).json({ success: false, message: 'Transferencia no encontrada' });
      }

      // Verificar permisos
      const solicitud = transferencia.solicitudes_credito;
      if (usuario.rol === 'solicitante' && solicitud?.solicitante_id !== usuario.id) {
        return res.status(403).json({ success: false, message: 'Sin permisos' });
      }

      if (!transferencia.ruta_comprobante) {
        return res.status(404).json({ success: false, message: 'Comprobante no disponible' });
      }

      const { data: urlData } = this.supabase.storage
        .from('kyc-documents')
        .getPublicUrl(transferencia.ruta_comprobante);

      return res.json({
        success: true,
        data: {
          url: urlData.publicUrl,
          nombre: `comprobante-${transferencia.numero_comprobante}`,
          tipo: 'comprobante'
        }
      });
    } catch (error) {
      console.error('Error en verComprobante:', error);
      res.status(500).json({ success: false, message: 'Error al obtener vista previa' });
    }
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
      res.status(500).json({ success: false, message: 'Error verificando firma' });
    }
  }
}

module.exports = TransferenciasBancariasController;