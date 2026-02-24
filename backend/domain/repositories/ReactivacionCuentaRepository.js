// backend/domain/repositories/ReactivacionCuentaRepository.js
class ReactivacionCuentaRepository {
  async crear(solicitudData) {
    throw new Error('Método no implementado');
  }

  async obtenerPorToken(token) {
    throw new Error('Método no implementado');
  }

  async obtenerPorEmail(email) {
    throw new Error('Método no implementado');
  }

  async marcarComoCompletado(token) {
    throw new Error('Método no implementado');
  }

  async limpiarExpirados() {
    throw new Error('Método no implementado');
  }
}

module.exports = ReactivacionCuentaRepository;
