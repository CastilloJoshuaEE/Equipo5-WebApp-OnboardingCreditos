//backend/application/use-cases/usuario/SolicitarRecuperacionCuenta.js
class SolicitarRecuperacionCuenta {
  constructor(usuarioRepository, emailService, authService) {
    this.usuarioRepository = usuarioRepository;
    this.emailService = emailService;
    this.authService = authService;
  }

  async execute({ email }) {
    if (!email) {
      return {
        success: false,
        status: 400,
        message: 'Email es requerido'
      };
    }

    const usuarioExistente = await this.usuarioRepository.findByEmail(email);

    if (!usuarioExistente) {
      return {
        success: true,
        message: 'Si el email está registrado, recibirás un enlace de recuperación'
      };
    }


    try {
      const emailResult = await this.emailService.enviarEmailRecuperacionCuenta(
        usuarioExistente.email,
        usuarioExistente.nombre_completo,
        usuarioExistente.id
      );

      if (emailResult.success) {
        return {
          success: true,
          message: 'Se ha enviado un enlace de recuperación a tu email. Por favor revisa tu bandeja de entrada.',
          tipo: 'personalizado'
        };
      }
    } catch (emailError) {
      console.warn('Error en email personalizado:', emailError.message);
    }

    const resetResult = await this.authService.resetPasswordForEmail(email);

    if (!resetResult.success) {
      throw resetResult.error;
    }

    return {
      success: true,
      message: 'Se ha enviado un enlace de recuperación a tu email. Por favor revisa tu bandeja de entrada.',
      tipo: 'supabase_auth'
    };
  }
}

module.exports = SolicitarRecuperacionCuenta;