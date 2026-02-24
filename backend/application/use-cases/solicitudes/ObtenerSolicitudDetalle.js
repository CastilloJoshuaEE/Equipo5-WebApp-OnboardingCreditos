// backend/application/use-cases/solicitudes/ObtenerSolicitudDetalle.js
class ObtenerSolicitudDetalle {
  constructor(solicitudRepository, documentoRepository, verificacionKYCRepository) {
    this.solicitudRepository = solicitudRepository;
    this.documentoRepository = documentoRepository;
    this.verificacionKYCRepository = verificacionKYCRepository;
  }

  async execute(solicitud_id, usuario) {
    const solicitud = await this.solicitudRepository.getSolicitudCompleta(solicitud_id);

    const tienePermiso = await this.solicitudRepository.verificarPermiso(
      solicitud_id,
      usuario.id,
      usuario.rol
    );

    if (!tienePermiso) {
      return {
        success: false,
        status: 403,
        message: 'No tienes permisos para ver esta solicitud'
      };
    }

    const documentos = await this.documentoRepository.findBySolicitud(solicitud_id);
    const verificaciones = await this.verificacionKYCRepository.findBySolicitudId(solicitud_id);

    return {
      success: true,
      data: {
        ...solicitud,
        documentos,
        verificaciones_kyc: verificaciones
      }
    };
  }
}

module.exports = ObtenerSolicitudDetalle;