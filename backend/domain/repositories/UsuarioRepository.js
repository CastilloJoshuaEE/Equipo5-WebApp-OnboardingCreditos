// backend/domain/repositories/UsuarioRepository.js
/**
 * Interfaz del repositorio de usuarios
 * Define los métodos que debe implementar cualquier repositorio de usuarios
 */
class UsuarioRepository {
  async findById(id) {
    throw new Error('Método no implementado');
  }

  async findByEmail(email) {
    throw new Error('Método no implementado');
  }

  async findInactiveByEmail(email) {
    throw new Error('Método no implementado');
  }

  async create(usuarioData) {
    throw new Error('Método no implementado');
  }

  async update(id, updates) {
    throw new Error('Método no implementado');
  }

  async deactivate(id, motivo) {
    throw new Error('Método no implementado');
  }

  async reactivate(id) {
    throw new Error('Método no implementado');
  }

  async updateRecoveryEmail(id, emailRecuperacion) {
    throw new Error('Método no implementado');
  }

  async findAll(filtros = {}, paginacion = {}) {
    throw new Error('Método no implementado');
  }

  async search(criterios) {
    throw new Error('Método no implementado');
  }

  async getProfileWithRoleData(id) {
    throw new Error('Método no implementado');
  }

  async exists(email) {
    throw new Error('Método no implementado');
  }
}

module.exports = UsuarioRepository;