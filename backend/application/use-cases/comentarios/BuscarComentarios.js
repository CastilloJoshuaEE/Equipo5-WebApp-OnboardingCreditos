// backend/application/use-cases/comentarios/BuscarComentarios.js
class BuscarComentarios {
  constructor(comentarioRepository) {
    this.comentarioRepository = comentarioRepository;
  }

  async execute({ q: query, limit = 20 }, usuario) {
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        status: 400,
        message: 'Término de búsqueda es requerido'
      };
    }

    try {
      const resultados = await this.comentarioRepository.buscar(
        query.trim(),
        usuario.id,
        usuario.rol,
        parseInt(limit)
      );

      return {
        success: true,
        data: resultados,
        total: resultados.length
      };

    } catch (error) {
      console.error('. Error en BuscarComentarios:', error);
      return {
        success: false,
        status: 500,
        message: 'Error al buscar comentarios'
      };
    }
  }
}

module.exports = BuscarComentarios;