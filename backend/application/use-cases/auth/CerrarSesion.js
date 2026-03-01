// backend/application/use-cases/auth/CerrarSesion.js
class CerrarSesion {
  constructor(authService) {
    this.authService = authService;
  }

  async execute() {
    const result = await this.authService.signOut();

    if (!result.success) {
      return {
        success: false,
        status: 500,
        message: result.error?.message || 'Error al cerrar sesión'
      };
    }

    return {
      success: true,
      message: 'Sesión cerrada correctamente'
    };
  }
}

module.exports = CerrarSesion;