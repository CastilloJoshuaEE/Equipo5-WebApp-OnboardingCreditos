// backend/application/use-cases/notificaciones/MarcarTodasComoLeidas.js
class MarcarTodasComoLeidas {
  constructor(notificacionRepository) {
    this.notificacionRepository = notificacionRepository;
  }

  async execute(usuarioId) {
    await this.notificacionRepository.marcarTodasComoLeidas(usuarioId);

    return {
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    };
  }
}

module.exports = MarcarTodasComoLeidas;