// backend/application/use-cases/solicitudes/ObtenerTodasSolicitudes.js
class ObtenerTodasSolicitudes {
  constructor(solicitudRepository) {
    this.solicitudRepository = solicitudRepository;
  }

  async execute(filtros = {}) {
    const { estado, nivel_riesgo, page = 1, limit = 10 } = filtros;

    const filtrosAplicados = {};
    if (estado) filtrosAplicados.estado = estado;
    if (nivel_riesgo) filtrosAplicados.nivel_riesgo = nivel_riesgo;
    if (page && limit) {
      filtrosAplicados.page = parseInt(page);
      filtrosAplicados.limit = parseInt(limit);
    }

    const { data: solicitudes, total } = await this.solicitudRepository.findAll(filtrosAplicados);

    return {
      success: true,
      data: solicitudes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = ObtenerTodasSolicitudes;