// backend/domain/repositories/OperadorRepository.js
/**
 * Interfaz del repositorio de operadores
 */
class OperadorRepository {
  async create(operadorData) {
    throw new Error('Método no implementado');
  }

  async update(id, updates) {
    throw new Error('Método no implementado');
  }

  async findByUserId(userId) {
    throw new Error('Método no implementado');
  }

  async findAll() {
    throw new Error('Método no implementado');
  }

  async findByNivel(nivel) {
    throw new Error('Método no implementado');
  }

  async hasPermission(userId, permission) {
    throw new Error('Método no implementado');
  }

  async getOperadorWithUsuario(id) {
    throw new Error('Método no implementado');
  }
}

module.exports = OperadorRepository;