// backend/application/use-cases/auth/RefrescarToken.js
class RefrescarToken {
  constructor(authService) {
    this.authService = authService;
  }

  async execute({ refresh_token }) {
    if (!refresh_token) {
      return {
        success: false,
        status: 400,
        message: 'Refresh token es requerido'
      };
    }

    const result = await this.authService.refreshSession(refresh_token);

    if (!result.success) {
      return {
        success: false,
        status: 401,
        message: 'Sesión expirada, por favor inicia sesión nuevamente'
      };
    }

    return {
      success: true,
      message: 'Token refrescado',
      data: {
        access_token: result.data.session.access_token,
        refresh_token: result.data.session.refresh_token,
        expires_at: result.data.session.expires_at
      }
    };
  }
}

module.exports = RefrescarToken;