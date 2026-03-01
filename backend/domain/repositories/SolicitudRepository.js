// backend/domain/repositories/SolicitudRepository.js
/**
 * Interfaz del repositorio de solicitudes
 */
class SolicitudRepository {
  async create(solicitudData) {
    throw new Error('Método no implementado');
  }

  async findById(id) {
    throw new Error('Método no implementado');
  }

  async findBySolicitanteId(solicitanteId) {
    throw new Error('Método no implementado');
  }
  async findByOperador(operadorId, filtros = {}) {
    throw new Error('Método no implementado');
  }

  async findByNumero(numeroSolicitud) {
    throw new Error('Método no implementado');
  }

  async findAll(filtros = {}) {
    throw new Error('Método no implementado');
  }

  async update(id, updates) {
    throw new Error('Método no implementado');
  }

  async cambiarEstado(id, estado, datosAdicionales = {}) {
    throw new Error('Método no implementado');
  }

  async asignarOperador(id, operadorId) {
    throw new Error('Método no implementado');
  }

  async getEstadisticas() {
    throw new Error('Método no implementado');
  }

  async verificarPermiso(solicitudId, usuarioId, rol) {
    throw new Error('Método no implementado');
  }

  async getDocumentos(solicitudId) {
    throw new Error('Método no implementado');
  }

  async getVerificacionesKYC(solicitudId) {
    throw new Error('Método no implementado');
  }

  async getSolicitudCompleta(id) {
    throw new Error('Método no implementado');
  }

  async asignarOperadorAutomatico(solicitudId) {
    throw new Error('Método no implementado');
  }
}

module.exports = SolicitudRepository;