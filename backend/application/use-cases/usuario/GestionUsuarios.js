// backend/application/use-cases/usuario/GestionUsuarios.js
class GestionUsuarios {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async obtenerTodos(filtros = {}) {
    const { rol, cuenta_activa, page = 1, limit = 10 } = filtros;

    const result = await this.usuarioRepository.findAll(
      { rol, cuenta_activa },
      { page: parseInt(page), limit: parseInt(limit) }
    );

    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  }

  async buscar(criterios = {}) {
    const { query, rol, campo = 'nombre_completo' } = criterios;

    if (!query) {
      return {
        success: false,
        status: 400,
        message: 'Término de búsqueda es requerido'
      };
    }

    const usuarios = await this.usuarioRepository.search({ query, rol, campo });

    return {
      success: true,
      data: usuarios
    };
  }
}

module.exports = GestionUsuarios;