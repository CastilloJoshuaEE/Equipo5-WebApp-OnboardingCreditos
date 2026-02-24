// backend/interfaces/controllers/FirmaDigitalController.js
class FirmaDigitalController {
  constructor(
    iniciarProcesoFirmaUseCase,
    obtenerInfoFirmaUseCase,
    procesarFirmaUseCase,
    descargarDocumentoFirmadoUseCase,
    obtenerFirmasPendientesUseCase,
    obtenerAuditoriaFirmaUseCase,
    obtenerEstadisticasFirmasUseCase,
    renovarFirmaExpiradaUseCase,
    repararRelacionFirmaContratoUseCase,
    verificarFirmaExistenteUseCase,
    reiniciarProcesoFirmaUseCase,
    supabase
  ) {
    this._iniciarProcesoFirma = iniciarProcesoFirmaUseCase;
    this._obtenerInfoFirma = obtenerInfoFirmaUseCase;
    this._procesarFirma = procesarFirmaUseCase;
    this._descargarDocumentoFirmado = descargarDocumentoFirmadoUseCase;
    this._obtenerFirmasPendientes = obtenerFirmasPendientesUseCase;
    this._obtenerAuditoriaFirma = obtenerAuditoriaFirmaUseCase;
    this._obtenerEstadisticasFirmas = obtenerEstadisticasFirmasUseCase;
    this._renovarFirmaExpirada = renovarFirmaExpiradaUseCase;
    this._repararRelacionFirmaContrato = repararRelacionFirmaContratoUseCase;
    this._verificarFirmaExistente = verificarFirmaExistenteUseCase;
    this._reiniciarProcesoFirma = reiniciarProcesoFirmaUseCase;
    this.supabase = supabase;
  }

  static generarHashDocumento(buffer, metadatos = {}) {
    const crypto = require('crypto');
    const contenido = buffer.toString('base64') + JSON.stringify(metadatos);
    return crypto.createHash('sha256').update(contenido).digest('hex');
  }

  async descargarDocumentoFirmado(req, res) {
    const { firma_id } = req.params;
    const usuario = req.usuario;

    const result = await this._descargarDocumentoFirmado.execute(firma_id, usuario);

    if (!result.success) {
      return res.status(result.status || 500).json(result);
    }

    res.setHeader('Content-Type', result.data.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.nombre_archivo}"`);
    res.setHeader('Content-Length', result.data.buffer.length);
    res.send(result.data.buffer);
  }

  async descargarContratoFirmadoEspecifico(req, res) {
    return this.descargarDocumentoFirmado(req, res);
  }

  async verificarEstadoFirma(req, res) {
    const { firma_id } = req.params;
    try {
      const { data: firma, error } = await this.supabase
        .from('firmas_digitales')
        .select('estado, integridad_valida, fecha_firma_solicitante, fecha_firma_operador')
        .eq('id', firma_id)
        .single();

      if (error) {
        return res.status(404).json({
          success: false,
          message: 'Firma no encontrada'
        });
      }

      res.json({
        success: true,
        data: firma
      });
    } catch (error) {
      console.error('Error verificando estado de firma:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando estado de firma'
      });
    }
  }

  async reenviarSolicitudFirma(req, res) {
    const { firma_id } = req.params;
    const operador_id = req.usuario.id;

    try {
      const { data: firma, error: firmaError } = await this.supabase
        .from('firmas_digitales')
        .select('*')
        .eq('id', firma_id)
        .eq('estado', 'expirado')
        .single();

      if (firmaError || !firma) {
        return res.status(404).json({
          success: false,
          message: 'Firma no encontrada o no está expirada'
        });
      }

      const updateData = {
        estado: 'enviado',
        fecha_envio: new Date().toISOString(),
        fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        intentos_envio: firma.intentos_envio + 1,
        ultimo_error: null,
        updated_at: new Date().toISOString()
      };

      const { data: firmaActualizada, error: updateError } = await this.supabase
        .from('firmas_digitales')
        .update(updateData)
        .eq('id', firma_id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({
        success: true,
        message: 'Solicitud de firma reenviada exitosamente',
        data: {
          firma_id: firma_id,
          nuevo_estado: 'enviado',
          fecha_expiracion: updateData.fecha_expiracion
        }
      });
    } catch (error) {
      console.error('Error reenviando solicitud de firma:', error);
      res.status(500).json({
        success: false,
        message: 'Error reenviando solicitud de firma: ' + error.message
      });
    }
  }

  async reiniciarProcesoFirma(req, res) {
    const { solicitud_id } = req.params;
    const { forzar_reinicio } = req.body;
    const usuario = req.usuario;

    usuario.ip = req.ip;
    usuario.userAgent = req.get('User-Agent');

    const result = await this._reiniciarProcesoFirma.execute(solicitud_id, { forzar_reinicio }, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerDocumentoActual(req, res) {
    const { firma_id } = req.params;

    try {
      const documentoResult = await this.wordService.obtenerUltimoDocumento(firma_id);

      if (!documentoResult.success) {
        return res.status(404).json({
          success: false,
          message: documentoResult.error
        });
      }

      const documentoBase64 = documentoResult.buffer.toString('base64');

      res.json({
        success: true,
        data: {
          documento: documentoBase64,
          es_documento_firmado: documentoResult.esDocumentoFirmado,
          hash_actual: documentoResult.hashActual,
          ruta_actual: documentoResult.ruta
        }
      });
    } catch (error) {
      console.error('Error obteniendo documento actual:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo documento actual: ' + error.message
      });
    }
  }

  async iniciarProcesoFirma(req, res) {
    const { solicitud_id } = req.params;
    const { forzar_reinicio } = req.body;
    const usuario = req.usuario;

    usuario.ip = req.ip;
    usuario.userAgent = req.get('User-Agent');

    const result = await this._iniciarProcesoFirma.execute(solicitud_id, usuario, { forzar_reinicio });
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerInfoFirma(req, res) {
    const { firma_id } = req.params;
    const usuario = req.usuario;

    usuario.ip = req.ip;
    usuario.userAgent = req.get('User-Agent');

    const result = await this._obtenerInfoFirma.execute(firma_id, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async procesarFirma(req, res) {
    const { firma_id } = req.params;
    const { firma_data, tipo_firma } = req.body;
    const usuario = req.usuario;

    usuario.ip = req.ip;
    usuario.userAgent = req.get('User-Agent');

    const result = await this._procesarFirma.execute(firma_id, { firma_data, tipo_firma }, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerDocumentoParaFirma(req, res) {
    const { firma_id } = req.params;
    const usuario = req.usuario;

    try {
      const fileData = await this.firmaDigitalRepository.obtenerDocumentoParaFirma(firma_id);
      const buffer = Buffer.from(await fileData.arrayBuffer());
      const documentoBase64 = buffer.toString('base64');

      res.json({
        success: true,
        data: {
          documento: documentoBase64,
          tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      });
    } catch (error) {
      console.error('Error obteniendo documento:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo documento: ' + error.message
      });
    }
  }

  async obtenerFirmasPendientes(req, res) {
    const usuario = req.usuario;

    const result = await this._obtenerFirmasPendientes.execute(usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerAuditoriaFirma(req, res) {
    const { firma_id } = req.params;
    const usuario = req.usuario;

    const result = await this._obtenerAuditoriaFirma.execute(firma_id, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerEstadisticasFirmas(req, res) {
    const usuario = req.usuario;

    const result = await this._obtenerEstadisticasFirmas.execute(usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async renovarFirmaExpirada(req, res) {
    const { firma_id } = req.params;
    const usuario = req.usuario;

    usuario.ip = req.ip;
    usuario.userAgent = req.get('User-Agent');

    const result = await this._renovarFirmaExpirada.execute(firma_id, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async repararRelacionFirmaContrato(req, res) {
    const { firma_id } = req.params;
    const usuario = req.usuario;

    usuario.ip = req.ip;
    usuario.userAgent = req.get('User-Agent');

    const result = await this._repararRelacionFirmaContrato.execute(firma_id, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async verificarFirmaExistente(req, res) {
    const { solicitud_id } = req.params;

    const result = await this._verificarFirmaExistente.execute(solicitud_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = FirmaDigitalController;