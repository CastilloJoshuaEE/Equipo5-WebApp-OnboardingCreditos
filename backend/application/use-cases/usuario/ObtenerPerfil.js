// backend/application/use-cases/usuario/ObtenerPerfil.js
class ObtenerPerfil {
  constructor(usuarioRepository, solicitanteRepository, operadorRepository) {
    this.usuarioRepository = usuarioRepository;
    this.solicitanteRepository = solicitanteRepository;
    this.operadorRepository = operadorRepository;
  }

  async execute(usuarioId) {
    const usuario = await this.usuarioRepository.findById(usuarioId);

    if (!usuario) {
      return {
        success: false,
        status: 404,
        message: 'Usuario no encontrado'
      };
    }

    // Estructura base de la respuesta
    const perfilResponse = {
      ...usuario.toJSON(), // Usamos toJSON para obtener solo los datos, sin métodos
    };

    if (usuario.rol === 'solicitante') {
      try {
        const solicitante = await this.solicitanteRepository.findByUserId(usuarioId);
        // Añadimos los datos del solicitante en una propiedad anidada
        perfilResponse.solicitantes = solicitante ? solicitante.toJSON() : null;
      } catch (error) {
        console.warn('No se encontraron datos de solicitante:', error.message);
        perfilResponse.solicitantes = null;
      }
    } else if (usuario.rol === 'operador') {
      try {
        const operador = await this.operadorRepository.findByUserId(usuarioId);
        // Añadimos los datos del operador en una propiedad anidada
        perfilResponse.operadores = operador ? operador.toJSON() : null;
      } catch (error) {
        console.warn('No se encontraron datos de operador:', error.message);
        perfilResponse.operadores = null;
      }
    }

    return {
      success: true,
      data: perfilResponse
    };
  }
}

module.exports = ObtenerPerfil;