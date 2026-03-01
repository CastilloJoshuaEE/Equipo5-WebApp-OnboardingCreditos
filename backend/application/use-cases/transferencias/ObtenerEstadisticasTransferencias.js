// backend/application/use-cases/transferencias/ObtenerEstadisticasTransferencias.js
class ObtenerEstadisticasTransferencias {
  constructor(transferenciaRepository) {
    this.transferenciaRepository = transferenciaRepository;
  }

  async execute(usuario) {
    const estadisticas = await this.transferenciaRepository.obtenerEstadisticas(
      usuario.id,
      usuario.rol
    );

    return {
      success: true,
      data: estadisticas
    };
  }
}

module.exports = ObtenerEstadisticasTransferencias;