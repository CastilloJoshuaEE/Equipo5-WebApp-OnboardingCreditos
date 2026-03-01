// backend/application/use-cases/comentarios/EliminarComentario.js
class EliminarComentario {
  constructor(comentarioRepository) {
    this.comentarioRepository = comentarioRepository;
  }

  async execute(comentarioId, usuario) {

    // Verificar permisos
    const tienePermisos = await this.comentarioRepository.verificarPermisos(
      comentarioId,
      usuario.id,
      usuario.rol
    );

    if (!tienePermisos) {
      return {
        success: false,
        status: 403,
        message: 'No tienes permisos para eliminar este comentario'
      };
    }

    try {
      await this.comentarioRepository.eliminar(comentarioId);


      return {
        success: true,
        message: 'Comentario eliminado exitosamente'
      };

    } catch (error) {
      console.error('. Error en EliminarComentario:', error);
      return {
        success: false,
        status: 500,
        message: 'Error al eliminar comentario'
      };
    }
  }
}

module.exports = EliminarComentario;