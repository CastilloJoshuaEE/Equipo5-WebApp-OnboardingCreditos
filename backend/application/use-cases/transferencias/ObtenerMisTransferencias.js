// backend/application/use-cases/transferencias/ObtenerMisTransferencias.js

class ObtenerMisTransferencias {
  constructor(transferenciaRepository) {
    this.transferenciaRepository = transferenciaRepository;
  }

  async execute(usuario) {
    console.log(`Obteniendo transferencias para: ${usuario.id} (${usuario.rol})`);

    if (usuario.rol !== 'solicitante') {
      return {
        success: false,
        status: 403,
        message: 'No autorizado para ver estas transferencias'
      };
    }

    const transferencias = await this.transferenciaRepository.obtenerTransferenciasSolicitante(usuario.id);

    return {
      success: true,
      data: transferencias || []
    };
  }
}

module.exports = ObtenerMisTransferencias;