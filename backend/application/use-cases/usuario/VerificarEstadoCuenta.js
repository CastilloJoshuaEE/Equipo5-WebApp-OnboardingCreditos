// backend/application/use-cases/usuario/VerificarEstadoCuenta.js
class VerificarEstadoCuenta {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(usuarioId) {
    const usuario = await this.usuarioRepository.findById(usuarioId);

    return {
      success: true,
      data: {
        cuenta_activa: usuario.cuenta_activa,
        fecha_desactivacion: usuario.fecha_desactivacion,
        email_recuperacion: usuario.email_recuperacion,
        tiene_email_recuperacion: !!usuario.email_recuperacion
      }
    };
  }
}

module.exports = VerificarEstadoCuenta;