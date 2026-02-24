// backend/application/use-cases/verificaciones/ObtenerVerificacionesPorSolicitud.js
class ObtenerVerificacionesPorSolicitud {
  constructor(verificacionKYCRepository) {
    this.verificacionKYCRepository = verificacionKYCRepository;
  }

  async execute(solicitudId) {
    const verificaciones = await this.verificacionKYCRepository.findBySolicitudId(solicitudId);

    return {
      success: true,
      data: verificaciones
    };
  }
}

module.exports = ObtenerVerificacionesPorSolicitud;