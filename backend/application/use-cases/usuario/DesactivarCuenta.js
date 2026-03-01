// backend/application/use-cases/usuario/DesactivarCuenta.js
class DesactivarCuenta {
  constructor(usuarioRepository, authService) {
    this.usuarioRepository = usuarioRepository;
    this.authService = authService;
  }

  async execute(usuarioId, email, { password, motivo }) {
    if (!password) {
      return {
        success: false,
        status: 400,
        message: 'La contraseña es requerida para desactivar la cuenta'
      };
    }

    const verifyResult = await this.authService.signInWithPassword(email, password);

    if (!verifyResult.success) {
      let errorMessage = 'La contraseña actual es incorrecta';
      if (verifyResult.error?.message?.includes('Invalid login credentials')) {
        errorMessage = 'La contraseña actual es incorrecta. Verifique e intente nuevamente.';
      } else if (verifyResult.error?.message?.includes('Email not confirmed')) {
        errorMessage = 'Su email no está confirmado. Por favor verifique su cuenta antes de cambiar la contraseña.';
      }
      return {
        success: false,
        status: 400,
        message: errorMessage,
        code: 'CONTRASENA_ACTUAL_INCORRECTA'
      };
    }

    const usuarioDesactivado = await this.usuarioRepository.deactivate(usuarioId, motivo);

    await this.authService.signOut();

    return {
      success: true,
      message: 'Cuenta desactivada exitosamente. Puedes reactivarla iniciando sesión nuevamente.',
      data: {
        usuario: usuarioDesactivado,
        fecha_desactivacion: new Date().toISOString()
      }
    };
  }
}

module.exports = DesactivarCuenta;