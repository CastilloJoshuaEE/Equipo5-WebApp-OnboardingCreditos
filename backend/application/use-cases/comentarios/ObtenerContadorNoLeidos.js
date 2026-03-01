// backend/application/use-cases/comentarios/ObtenerContadorNoLeidos.js
class ObtenerContadorNoLeidos {
  constructor(comentarioRepository) {
    this.comentarioRepository = comentarioRepository;
  }

  async execute(usuarioId) {
    try {
      const count = await this.comentarioRepository.obtenerContadorNoLeidos(usuarioId);

      return {
        success: true,
        data: { count }
      };

    } catch (error) {
      console.error('. Error en ObtenerContadorNoLeidos:', error);
      return {
        success: false,
        status: 500,
        message: 'Error al obtener contador de comentarios no leídos'
      };
    }
  }
}

module.exports = ObtenerContadorNoLeidos;