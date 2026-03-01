// backend/application/use-cases/verificaciones/ObtenerVerificacionPorSessionId.js
class ObtenerVerificacionPorSessionId {
  constructor(verificacionKYCRepository) {
    this.verificacionKYCRepository = verificacionKYCRepository;
  }

  async execute(sessionId) {
    const verificacion = await this.verificacionKYCRepository.findBySessionId(sessionId);

    if (!verificacion) {
      return {
        success: false,
        status: 404,
        message: 'Verificación KYC no encontrada'
      };
    }

    return {
      success: true,
      data: verificacion
    };
  }
}

module.exports = ObtenerVerificacionPorSessionId;