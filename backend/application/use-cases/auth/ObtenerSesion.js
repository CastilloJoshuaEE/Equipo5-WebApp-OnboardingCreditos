// backend/application/use-cases/auth/ObtenerSesion.js
class ObtenerSesion {
  constructor(usuarioRepository, authService) {
    this.usuarioRepository = usuarioRepository;
    this.authService = authService;
  }

  async execute() {
    const sessionResult = await this.authService.getSession();

    if (!sessionResult.success || !sessionResult.data.session) {
      return {
        success: false,
        status: 401,
        message: 'No hay sesión activa'
      };
    }

    const session = sessionResult.data.session;
    const user = session.user;

    let userProfile = await this.usuarioRepository.findById(user.id);

    if (!userProfile) {
      userProfile = await this.usuarioRepository.findByEmail(user.email);

      if (!userProfile) {
        return {
          success: false,
          status: 404,
          message: 'Perfil de usuario no encontrado. Por favor inicie sesión nuevamente.'
        };
      }

      await this.corregirInconsistenciaIDs(user.id, userProfile.id, user.email);

      if (!userProfile.cuenta_activa) {
        return {
          success: false,
          status: 401,
          message: 'Cuenta desactivada'
        };
      }

      return {
        success: true,
        data: {
          session,
          user,
          profile: userProfile,
          idInconsistency: true,
          autoCorrected: true
        }
      };
    }

    if (!userProfile) {
      return {
        success: false,
        status: 404,
        message: 'Perfil de usuario no encontrado. Por favor inicie sesión nuevamente.'
      };
    }

    if (!userProfile.cuenta_activa) {
      return {
        success: false,
        status: 401,
        message: 'Cuenta desactivada'
      };
    }

    return {
      success: true,
      data: {
        session,
        user,
        profile: userProfile
      }
    };
  }

  async corregirInconsistenciaIDs(authId, tablaId, email) {
    try {
      await this.usuarioRepository.update(tablaId, { id: authId });
      return true;
    } catch (error) {
      console.error('Error corrigiendo inconsistencia de IDs:', error);
      return false;
    }
  }
}

module.exports = ObtenerSesion;