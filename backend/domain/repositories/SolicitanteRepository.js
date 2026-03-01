// backend/domain/repositories/SolicitanteRepository.js
/**
 * Interfaz del repositorio de solicitantes
 */
class SolicitanteRepository {
  async create(solicitanteData) {
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

  async findByCuit(cuit) {
    throw new Error('Método no implementado');
  }

  async getSolicitanteWithUsuario(id) {
    throw new Error('Método no implementado');
  }
}

module.exports = SolicitanteRepository;