// backend/application/use-cases/comentarios/ObtenerComentariosSolicitud.js
class ObtenerComentariosSolicitud {
  constructor(comentarioRepository) {
    this.comentarioRepository = comentarioRepository;
  }

  async execute(solicitudId, usuario, filtros = {}) {
    const { tipo, limit = 50, offset = 0 } = filtros;

    console.log(`. Obteniendo comentarios para solicitud: ${solicitudId}`);

    // Verificar permisos
    const tienePermisos = await this.comentarioRepository.verificarPermisosSolicitud(
      solicitudId,
      usuario.id,
      usuario.rol
    );

    if (!tienePermisos) {
      return {
        success: false,
        status: 403,
        message: 'No tienes permisos para ver los comentarios de esta solicitud'
      };
    }

    try {
      // Obtener comentarios
      const comentarios = await this.comentarioRepository.obtenerPorSolicitud(solicitudId, {
        tipo,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Marcar como leídos si hay comentarios
      if (comentarios.length > 0) {
        await this.comentarioRepository.marcarComoLeidos(solicitudId, usuario.id);
      }

      console.log(`. Comentarios obtenidos: ${comentarios.length}`);

      return {
        success: true,
        data: comentarios,
        total: comentarios.length
      };

    } catch (error) {
      console.error('. Error en ObtenerComentariosSolicitud:', error);
      return {
        success: false,
        status: 500,
        message: 'Error al obtener comentarios'
      };
    }
  }
}

module.exports = ObtenerComentariosSolicitud;