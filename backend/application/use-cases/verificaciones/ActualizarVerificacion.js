// backend/application/use-cases/verificaciones/ActualizarVerificacion.js
class ActualizarVerificacion {
  constructor(verificacionKYCRepository) {
    this.verificacionKYCRepository = verificacionKYCRepository;
  }

  async execute(id, updates) {
    const verificacionActualizada = await this.verificacionKYCRepository.update(id, updates);

    return {
      success: true,
      data: verificacionActualizada
    };
  }
}

module.exports = ActualizarVerificacion;