// backend/application/use-cases/transferencias/ObtenerHistorialTransferencias.js
class ObtenerHistorialTransferencias {
  constructor(transferenciaRepository) {
    this.transferenciaRepository = transferenciaRepository;
  }

  async execute(usuario) {
    const transferencias = await this.transferenciaRepository.obtenerHistorialPorUsuario(
      usuario.id,
      usuario.rol
    );

    return {
      success: true,
      data: transferencias || []
    };
  }
}

module.exports = ObtenerHistorialTransferencias;