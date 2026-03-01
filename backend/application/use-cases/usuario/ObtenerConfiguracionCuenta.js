// backend/application/use-cases/usuario/ObtenerConfiguracionCuenta.js
class ObtenerConfiguracionCuenta {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
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

    return {
      success: true,
      data: {
        email_principal: usuario.email,
        email_recuperacion: usuario.email_recuperacion,
        cuenta_activa: usuario.cuenta_activa,
        fecha_desactivacion: usuario.fecha_desactivacion
      }
    };
  }
}

module.exports = ObtenerConfiguracionCuenta;