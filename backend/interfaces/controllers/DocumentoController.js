// backend/interfaces/controllers/DocumentoController.js
class DocumentoController {
  constructor(
    subirDocumentoUseCase,
    obtenerDocumentosSolicitudUseCase,
    validarDocumentoUseCase,
    descargarDocumentoUseCase,
    actualizarDocumentoUseCase,
    eliminarDocumentoUseCase,
    evaluarDocumentoUseCase,
    obtenerHistorialEvaluacionesUseCase,
    obtenerDocumentosContratoUseCase,
    listarDocumentosStorageUseCase,
    obtenerComprobantesTransferenciaUseCase,
    descargarContratoUseCase,
    descargarComprobanteUseCase,
    verDocumentoUseCase,
    obtenerMisSolicitudesConDocumentosUseCase,
    obtenerTodosLosDocumentosUseCase,
    supabase
  ) {
    this._subirDocumento = subirDocumentoUseCase;
    this._obtenerDocumentosSolicitud = obtenerDocumentosSolicitudUseCase;
    this._validarDocumento = validarDocumentoUseCase;
    this._descargarDocumento = descargarDocumentoUseCase;
    this._actualizarDocumento = actualizarDocumentoUseCase;
    this._eliminarDocumento = eliminarDocumentoUseCase;
    this._evaluarDocumento = evaluarDocumentoUseCase;
    this._obtenerHistorialEvaluaciones = obtenerHistorialEvaluacionesUseCase;
    this._obtenerDocumentosContrato = obtenerDocumentosContratoUseCase;
    this._listarDocumentosStorage = listarDocumentosStorageUseCase;
    this._obtenerComprobantesTransferencia = obtenerComprobantesTransferenciaUseCase;
    this._descargarContrato = descargarContratoUseCase;
    this._descargarComprobante = descargarComprobanteUseCase;
    this._verDocumento = verDocumentoUseCase;
    this._obtenerMisSolicitudesConDocumentos = obtenerMisSolicitudesConDocumentosUseCase;
    this._obtenerTodosLosDocumentos = obtenerTodosLosDocumentosUseCase;
    this.supabase = supabase;
  }

  async subirDocumento(req, res) {
    const { solicitud_id } = req.params;
    const { tipo } = req.body;
    const archivo = req.file;
    const result = await this._subirDocumento.execute(solicitud_id, tipo, archivo);
    return res.status(result.status || (result.success ? 201 : 500)).json(result);
  }

  async obtenerDocumentosSolicitud(req, res) {
    const { solicitud_id } = req.params;
    const result = await this._obtenerDocumentosSolicitud.execute(solicitud_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async validarDocumento(req, res) {
    const { documento_id } = req.params;
    const { estado, comentarios } = req.body;
    const usuario = req.usuario;
    const result = await this._validarDocumento.execute(documento_id, { estado, comentarios }, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async descargarDocumento(req, res) {
    const { documento_id } = req.params;
    const usuario = req.usuario;
    const result = await this._descargarDocumento.execute(documento_id, usuario);
    if (!result.success) {
      return res.status(result.status || 500).json(result);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.nombre_archivo}"`);
    res.setHeader('Content-Length', result.data.buffer.length);
    res.send(result.data.buffer);
  }

  async actualizarDocumento(req, res) {
    const { documento_id } = req.params;
    const { tipo } = req.body;
    const archivo = req.file;
    const usuario = req.usuario;
    const result = await this._actualizarDocumento.execute(documento_id, tipo, archivo, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async eliminarDocumento(req, res) {
    const { documento_id } = req.params;
    const result = await this._eliminarDocumento.execute(documento_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async evaluarDocumento(req, res) {
    const { documento_id } = req.params;
    const { criterios, comentarios, estado } = req.body;
    const usuario = req.usuario;
    const result = await this._evaluarDocumento.execute(documento_id, { criterios, comentarios, estado }, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerHistorialEvaluaciones(req, res) {
    const { documento_id } = req.params;
    const result = await this._obtenerHistorialEvaluaciones.execute(documento_id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerDocumentosContrato(req, res) {
    const { solicitud_id } = req.params;
    const usuario = req.usuario;
    const result = await this._obtenerDocumentosContrato.execute(solicitud_id, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async listarDocumentosStorage(req, res) {
    const { solicitud_id } = req.params;
    const usuario = req.usuario;
    const result = await this._listarDocumentosStorage.execute(solicitud_id, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerComprobantesTransferencia(req, res) {
    const { solicitud_id } = req.params;
    const usuario = req.usuario;
    const result = await this._obtenerComprobantesTransferencia.execute(solicitud_id, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async descargarContrato(req, res) {
    const { contrato_id } = req.params;
    const usuario = req.usuario;
    const result = await this._descargarContrato.execute(contrato_id, usuario);
    if (!result.success) {
      return res.status(result.status || 500).json(result);
    }
    res.setHeader('Content-Type', result.data.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.nombre_archivo}"`);
    res.setHeader('Content-Length', result.data.buffer.length);
    res.send(result.data.buffer);
  }

  async descargarComprobante(req, res) {
    const { transferencia_id } = req.params;
    const usuario = req.usuario;
    const result = await this._descargarComprobante.execute(transferencia_id, usuario);
    if (!result.success) {
      return res.status(result.status || 500).json(result);
    }
    res.setHeader('Content-Type', result.data.content_type);
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.nombre_archivo}"`);
    res.setHeader('Content-Length', result.data.buffer.length);
    res.send(result.data.buffer);
  }

  async verDocumento(req, res) {
    const { tipo, id } = req.params;
    const usuario = req.usuario;
    const result = await this._verDocumento.execute(tipo, id, usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerMisSolicitudesConDocumentos(req, res) {
    const usuario = req.usuario;
    const result = await this._obtenerMisSolicitudesConDocumentos.execute(usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerTodosLosDocumentos(req, res) {
    const usuario = req.usuario;
    const result = await this._obtenerTodosLosDocumentos.execute(usuario);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = DocumentoController;