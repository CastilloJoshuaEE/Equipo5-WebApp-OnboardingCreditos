// backend/application/use-cases/verificaciones/CrearVerificacionKYC.js
const VerificacionKYC = require('../../../domain/entities/VerificacionKYC');

class CrearVerificacionKYC {
  constructor(verificacionKYCRepository) {
    this.verificacionKYCRepository = verificacionKYCRepository;
  }

  async execute(verificacionData) {
    const verificacion = new VerificacionKYC(verificacionData);
    const nuevaVerificacion = await this.verificacionKYCRepository.crear(verificacion.toJSON());

    return {
      success: true,
      data: nuevaVerificacion
    };
  }
}

module.exports = CrearVerificacionKYC;