// backend/application/use-cases/verificaciones/ActualizarVerificacionPorSessionId.js
class ActualizarVerificacionPorSessionId {
  constructor(verificacionKYCRepository) {
    this.verificacionKYCRepository = verificacionKYCRepository;
  }

  async execute(sessionId, updates) {
    const verificacionActualizada = await this.verificacionKYCRepository.updateBySessionId(sessionId, updates);

    return {
      success: true,
      data: verificacionActualizada
    };
  }
}

module.exports = ActualizarVerificacionPorSessionId;