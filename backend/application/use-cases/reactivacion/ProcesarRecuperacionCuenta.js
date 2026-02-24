// backend/application/use-cases/reactivacion/ProcesarRecuperacionCuenta.js
const ReactivacionCuenta = require('../../../domain/entities/ReactivacionCuenta');

class ProcesarRecuperacionCuenta {
  constructor(usuarioRepository, supabaseAdmin, authController) {
    this.usuarioRepository = usuarioRepository;
    this.supabaseAdmin = supabaseAdmin;
    this.authController = authController;
  }

  async execute({ token, email }) {
    console.log('[RECUPERACIÓN] Procesando recuperación de cuenta (JSON):', {
      token: token ? `${token.substring(0, 20)}...` : 'undefined',
      email
    });

    if (!token || !email) {
      return {
        success: false,
        status: 400,
        message: 'Token o email faltante'
      };
    }

    try {
      const decodedToken = ReactivacionCuenta.decodificarToken(token);
      console.log('Token decodificado:', decodedToken);

      if (decodedToken.email !== email) {
        console.error('Email no coincide:', { tokenEmail: decodedToken.email, email });
        return {
          success: false,
          status: 400,
          message: 'Token inválido'
        };
      }

      const tokenTime = decodedToken.timestamp;
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (currentTime - tokenTime > oneHour) {
        console.error('Token expirado:', { tokenTime, currentTime });
        return {
          success: false,
          status: 400,
          message: 'Token expirado'
        };
      }

      console.log('Token válido, buscando usuario:', email);

      const usuario = await this.usuarioRepository.findByEmail(email);

      if (!usuario) {
        console.error('Usuario no encontrado:', email);
        return {
          success: false,
          status: 404,
          message: 'Usuario no encontrado'
        };
      }

      if (usuario.id !== decodedToken.userId) {
        console.warn('INCONSISTENCIA DE ID DETECTADA:', {
          tokenUserId: decodedToken.userId,
          tablaUserId: usuario.id,
          email
        });

        console.log('Corrigiendo inconsistencia de ID...');
        await this.supabaseAdmin
          .from('usuarios')
          .update({ id: decodedToken.userId })
          .eq('email', email);
      }

      if (usuario.cuenta_activa) {
        console.log('Usuario ya está activo:', email);
        return {
          success: true,
          message: 'Cuenta ya activa',
          cuenta_activa: true
        };
      }

      console.log('Usuario inactivo encontrado, reactivando cuenta...');

      await this.usuarioRepository.reactivate(decodedToken.userId);

      const limpiezaExitosa = await this.authController.limpiarIntentosFallidos(email);

      return {
        success: true,
        message: 'Cuenta reactivada exitosamente',
        cuenta_reactivada: true,
        email,
        intentos_limpiados: limpiezaExitosa
      };
    } catch (decodeError) {
      console.error('Error decodificando token:', decodeError);
      return {
        success: false,
        status: 400,
        message: 'Token inválido'
      };
    }
  }
}

module.exports = ProcesarRecuperacionCuenta;