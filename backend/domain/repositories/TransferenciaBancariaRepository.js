// backend/domain/repositories/TransferenciaBancariaRepository.js
class TransferenciaBancariaRepository {
  async crear(transferenciaData) {
    throw new Error('Método no implementado');
  }

  async obtenerPorId(id) {
    throw new Error('Método no implementado');
  }

  async obtenerPorSolicitud(solicitudId) {
    throw new Error('Método no implementado');
  }

  async actualizarEstado(id, estado, datosAdicionales = {}) {
    throw new Error('Método no implementado');
  }

  async actualizarRutaComprobante(id, rutaComprobante) {
    throw new Error('Método no implementado');
  }

  async obtenerHistorialPorUsuario(usuarioId, usuarioRol) {
    throw new Error('Método no implementado');
  }

  async obtenerTransferenciasSolicitante(solicitanteId) {
    throw new Error('Método no implementado');
  }

  async verificarTransferenciaExistente(solicitudId) {
    throw new Error('Método no implementado');
  }

  async verificarPermisos(transferenciaId, usuarioId, usuarioRol) {
    throw new Error('Método no implementado');
  }

  async obtenerEstadisticas(usuarioId = null, usuarioRol = null) {
    throw new Error('Método no implementado');
  }

  async obtenerRecientes(limite = 10) {
    throw new Error('Método no implementado');
  }

  async verificarEstadoFirma(solicitudId) {
    throw new Error('Método no implementado');
  }

  async obtenerSolicitud(solicitudId) {
    throw new Error('Método no implementado');
  }

  async obtenerContactoBancario(contactoId) {
    throw new Error('Método no implementado');
  }

  async obtenerContrato(solicitudId) {
    throw new Error('Método no implementado');
  }

  async obtenerInfoComprobante(transferenciaId) {
    throw new Error('Método no implementado');
  }

  async crearNotificaciones(notificacionesData) {
    throw new Error('Método no implementado');
  }

  async marcarSolicitudComoCerrada(solicitudId) {
    throw new Error('Método no implementado');
  }
}

module.exports = TransferenciaBancariaRepository;