// backend/application/use-cases/solicitudes/ObtenerEstadisticasSolicitudes.js
class ObtenerEstadisticasSolicitudes {
  constructor(solicitudRepository) {
    this.solicitudRepository = solicitudRepository;
  }

  async execute(usuario) {
    if (usuario.rol !== 'operador') {
      return {
        success: false,
        status: 403,
        message: 'Solo los operadores pueden ver las estadísticas'
      };
    }

    const estadisticas = await this.solicitudRepository.getEstadisticas();

    return {
      success: true,
      data: estadisticas
    };
  }
}

module.exports = ObtenerEstadisticasSolicitudes;