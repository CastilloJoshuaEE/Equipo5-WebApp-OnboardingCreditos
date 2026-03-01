// backend/application/use-cases/notificaciones/MarcarComoLeida.js
class MarcarComoLeida {
  constructor(notificacionRepository) {
    this.notificacionRepository = notificacionRepository;
  }

  async execute(id, usuarioId) {
    const esPropietario = await this.notificacionRepository.verificarPropiedad(id, usuarioId);

    if (!esPropietario) {
      return {
        success: false,
        status: 403,
        message: 'No tienes permisos para esta notificación'
      };
    }

    await this.notificacionRepository.marcarComoLeida(id, usuarioId);

    return {
      success: true,
      message: 'Notificación marcada como leída'
    };
  }
}

module.exports = MarcarComoLeida;