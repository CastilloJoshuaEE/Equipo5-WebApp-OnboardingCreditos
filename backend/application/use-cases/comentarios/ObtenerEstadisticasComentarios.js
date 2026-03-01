// backend/application/use-cases/comentarios/ObtenerEstadisticasComentarios.js
class ObtenerEstadisticasComentarios {
  constructor(comentarioRepository) {
    this.comentarioRepository = comentarioRepository;
  }

  async execute(usuario) {
    try {
      const estadisticas = await this.comentarioRepository.obtenerEstadisticas(
        usuario.id,
        usuario.rol
      );

      return {
        success: true,
        data: estadisticas
      };

    } catch (error) {
      console.error('. Error en ObtenerEstadisticasComentarios:', error);
      return {
        success: false,
        status: 500,
        message: 'Error al obtener estadísticas de comentarios'
      };
    }
  }
}

module.exports = ObtenerEstadisticasComentarios;