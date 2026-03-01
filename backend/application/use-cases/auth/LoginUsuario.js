// backend/application/use-cases/auth/LoginUsuario.js
const Usuario = require('../../../domain/entities/Usuario');
const IntentoLogin = require('../../../domain/entities/IntentoLogin');

class LoginUsuario {
  constructor(
    usuarioRepository,
    intentoLoginRepository,
    authService
  ) {
    this.usuarioRepository = usuarioRepository;
    this.intentoLoginRepository = intentoLoginRepository;
    this.authService = authService;
  }

  async execute({ email, password, ipAddress, userAgent }) {
    if (!email || !password) {
      return {
        success: false,
        status: 400,
        message: 'Email y contraseña son requeridos'
      };
    }

    await this.intentoLoginRepository.deleteOldFailures(email);

    const bloqueado = await this.intentoLoginRepository.isBlocked(email);
    if (bloqueado.bloqueado) {
      await this.intentoLoginRepository.registerAttempt(email, null, false, ipAddress, userAgent, true);
      return {
        success: false,
        status: 429,
        message: `Cuenta temporalmente bloqueada. Intente nuevamente en ${bloqueado.minutosRestantes} minutos o use la opción de "Recuperar cuenta".`
      };
    }

    const usuarioExistente = await this.usuarioRepository.findByEmail(email);

    if (!usuarioExistente) {
      await this.intentoLoginRepository.registerAttempt(email, null, false, ipAddress, userAgent);
      return {
        success: false,
        status: 401,
        message: 'No hay una cuenta registrada con este email. Por favor regístrese primero.'
      };
    }

    if (!usuarioExistente.cuenta_activa) {
      return {
        success: false,
        status: 401,
        message: 'Cuenta inactiva. Por favor use la opción de "Recuperar cuenta" para reactivarla.'
      };
    }

    const authResult = await this.authService.signInWithPassword(email, password);
    const intentoExitoso = authResult.success;

    await this.intentoLoginRepository.registerAttempt(
      email,
      usuarioExistente.id,
      intentoExitoso,
      ipAddress,
      userAgent
    );

    if (!intentoExitoso) {
      const nuevosIntentos = await this.intentoLoginRepository.countRecentFailures(email);
      if (nuevosIntentos >= IntentoLogin.MAX_INTENTOS_FALLIDOS) {
        return {
          success: false,
          status: 429,
          message: 'Cuenta temporalmente bloqueada por seguridad después de múltiples intentos fallidos. Espere 15 minutos o use la opción de "Olvidaste tu contraseña?".'
        };
      }

      let errorMessage = 'Credenciales inválidas';
      if (authResult.error?.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (authResult.error?.message?.includes('Email not confirmed')) {
        const userProfile = {
          id: usuarioExistente.id,
          email: usuarioExistente.email,
          nombre_completo: usuarioExistente.nombre_completo,
          rol: usuarioExistente.rol,
          cuenta_activa: true
        };
        return {
          success: true,
          message: 'Login exitoso (confirmación local)',
          data: {
            user: userProfile,
            profile: userProfile,
            session: {
              access_token: 'local_auth_no_token',
              refresh_token: 'local_auth_no_token',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              user: { id: usuarioExistente.id, email: usuarioExistente.email }
            },
            localAuth: true
          }
        };
      }
      return {
        success: false,
        status: 401,
        message: errorMessage
      };
    }

    const authUserId = authResult.data.user.id;
    const nuestraUserId = usuarioExistente.id;

    if (authUserId !== nuestraUserId) {
      await this.usuarioRepository.update(nuestraUserId, { id: authUserId });
      await this.corregirInconsistenciaIDs(authUserId, nuestraUserId, email);
    }

    let userProfile = await this.usuarioRepository.findById(authUserId);
    if (!userProfile) {
      userProfile = await this.usuarioRepository.findByEmail(email);
      if (!userProfile) {
        return {
          success: false,
          status: 500,
          message: 'No se pudo obtener el perfil del usuario'
        };
      }
      return {
        success: true,
        message: 'Login exitoso (perfil obtenido por email)',
        data: {
          user: authResult.data.user,
          profile: userProfile,
          session: authResult.data.session,
          idInconsistency: true
        }
      };
    }

    return {
      success: true,
      message: 'Login exitoso',
      data: {
        user: authResult.data.user,
        profile: userProfile,
        session: authResult.data.session
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

module.exports = LoginUsuario;