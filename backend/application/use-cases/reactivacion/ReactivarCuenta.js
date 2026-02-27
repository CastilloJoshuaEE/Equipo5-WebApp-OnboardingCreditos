// backend/application/use-cases/reactivacion/ReactivarCuenta.js
class ReactivarCuenta {
  constructor(usuarioRepository, authService) {
    this.usuarioRepository = usuarioRepository;
    this.authService = authService;
  }

  async execute({ email, password }) {
    if (!email || !password) {
      return {
        success: false,
        status: 400,
        message: 'Email y contraseña son requeridos'
      };
    }

    // Buscar usuario inactivo
    const usuario = await this.usuarioRepository.findInactiveByEmail(email);

    if (!usuario) {
      return {
        success: false,
        status: 404,
        message: 'No se encontró una cuenta desactivada con este email'
      };
    }

    // Verificar credenciales con Supabase Auth
    const authResult = await this.authService.signInWithPassword(email, password);

    if (!authResult.success) {
      return {
        success: false,
        status: 401,
        message: 'Credenciales inválidas'
      };
    }

    // Reactivar la cuenta
    const usuarioReactivated = await this.usuarioRepository.reactivate(usuario.id);

    return {
      success: true,
      message: 'Cuenta reactivada exitosamente. ¡Bienvenido de nuevo!',
      data: {
        user: authResult.data.user,
        profile: usuarioReactivated
      }
    };
  }
}

module.exports = ReactivarCuenta;