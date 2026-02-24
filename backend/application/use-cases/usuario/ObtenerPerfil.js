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

    let datosEspecificos = {};

    if (usuario.rol === 'solicitante') {
      try {
        const solicitante = await this.solicitanteRepository.findByUserId(usuarioId);
        datosEspecificos = {
          nombre_empresa: solicitante?.nombre_empresa,
          cuit: solicitante?.cuit,
          representante_legal: solicitante?.representante_legal,
          domicilio: solicitante?.domicilio,
          tipo: solicitante?.tipo
        };
      } catch (error) {
        console.warn('No se encontraron datos de solicitante:', error.message);
      }
    } else if (usuario.rol === 'operador') {
      try {
        const operador = await this.operadorRepository.findByUserId(usuarioId);
        datosEspecificos = {
          nivel: operador?.nivel,
          permisos: operador?.permisos
        };
      } catch (error) {
        console.warn('No se encontraron datos de operador:', error.message);
      }
    }

    return {
      success: true,
      data: {
        ...usuario,
        ...datosEspecificos
      }
    };
  }
}

module.exports = ObtenerPerfil;