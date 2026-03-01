// backend/application/use-cases/verificaciones/ObtenerVerificacionPorId.js
class ObtenerVerificacionPorId {
  constructor(verificacionKYCRepository) {
    this.verificacionKYCRepository = verificacionKYCRepository;
  }

  async execute(id) {
    const verificacion = await this.verificacionKYCRepository.findById(id);

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

module.exports = ObtenerVerificacionPorId;