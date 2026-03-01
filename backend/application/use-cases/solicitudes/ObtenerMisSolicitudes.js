// backend/application/use-cases/solicitudes/ObtenerMisSolicitudes.js
class ObtenerMisSolicitudes {
  constructor(solicitudRepository) {
    this.solicitudRepository = solicitudRepository;
  }

  async execute(usuario) {
    const solicitante_id = usuario.id;
    const solicitudes = await this.solicitudRepository.findBySolicitanteId(solicitante_id);

    return {
      success: true,
      data: solicitudes
    };
  }
}

module.exports = ObtenerMisSolicitudes;