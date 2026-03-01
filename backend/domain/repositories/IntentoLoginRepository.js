// backend/domain/repositories/IntentoLoginRepository.js
/**
 * Interfaz del repositorio de intentos de login
 */
class IntentoLoginRepository {
  async create(intentoData) {
    throw new Error('Método no implementado');
  }

  async findRecentFailures(email, minutos = 15) {
    throw new Error('Método no implementado');
  }

  async countRecentFailures(email, minutos = 15) {
    throw new Error('Método no implementado');
  }

  async deleteAllFailures(email) {
    throw new Error('Método no implementado');
  }

  async deleteOldFailures(email, minutos = 15) {
    throw new Error('Método no implementado');
  }

  async registerAttempt(email, usuarioId, exitoso, ip, userAgent, bloqueado = false) {
    throw new Error('Método no implementado');
  }

  async isBlocked(email) {
    throw new Error('Método no implementado');
  }
}

module.exports = IntentoLoginRepository;