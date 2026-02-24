// backend/application/use-cases/usuario/ActualizarEmailRecuperacion.js
class ActualizarEmailRecuperacion {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(usuarioId, emailPrincipal, { email_recuperacion }) {
    if (!email_recuperacion) {
      return {
        success: false,
        status: 400,
        message: 'El email de recuperación es requerido'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_recuperacion)) {
      return {
        success: false,
        status: 400,
        message: 'El formato del email de recuperación no es válido'
      };
    }

    if (email_recuperacion === emailPrincipal) {
      return {
        success: false,
        status: 400,
        message: 'El email de recuperación no puede ser igual al email principal'
      };
    }

    const updatedUser = await this.usuarioRepository.updateRecoveryEmail(usuarioId, email_recuperacion);

    return {
      success: true,
      message: 'Email de recuperación actualizado exitosamente',
      data: {
        email_recuperacion: updatedUser.email_recuperacion
      }
    };
  }
}

module.exports = ActualizarEmailRecuperacion;