// backend/application/use-cases/reactivacion/ProcesarRecuperacionCuenta.js

class ProcesarRecuperacionCuenta {
  constructor(usuarioRepository, supabaseAdmin, authController) {
    this.usuarioRepository = usuarioRepository;
    this.supabaseAdmin = supabaseAdmin;
    this.authController = authController; 
  }

  async execute({ token, email }) {
    try {

      if (!token || !email) {
        return {
          success: false,
          status: 400,
          message: 'Token y email son requeridos'
        };
      }

      // Decodificar token
      let tokenData;
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        
        const parts = decoded.split(':');
        if (parts.length !== 4) {
          throw new Error('Formato de token inválido');
        }
        
        const [userId, tokenEmail, timestamp, type] = parts;
        
        if (type !== 'recuperacion') {
          throw new Error('Tipo de token inválido');
        }
        
        tokenData = {
          userId,
          email: tokenEmail,
          timestamp: parseInt(timestamp)
        };
        
      } catch (error) {
        console.error('Error decodificando token:', error);
        return {
          success: false,
          status: 400,
          message: 'Token inválido o malformado'
        };
      }

      // Verificar que el email del token coincide con el email proporcionado
      if (tokenData.email !== email) {
        return {
          success: false,
          status: 400,
          message: 'El email no coincide con el token'
        };
      }

      // Verificar expiración (1 hora)
      const now = Date.now();
      const tokenAge = now - tokenData.timestamp;
      const oneHour = 60 * 60 * 1000;

      if (tokenAge > oneHour) {
        return {
          success: false,
          status: 400,
          message: 'El token ha expirado. Por favor solicita uno nuevo.'
        };
      }

      // Buscar usuario inactivo
      const usuario = await this.usuarioRepository.findInactiveByEmail(email);

      if (!usuario) {
        // Verificar si el usuario ya está activo
        const usuarioActivo = await this.usuarioRepository.findByEmail(email);
        
        if (usuarioActivo && usuarioActivo.cuenta_activa) {
          return {
            success: true,
            cuenta_activa: true,
            message: 'La cuenta ya está activa'
          };
        }

        return {
          success: false,
          status: 404,
          message: 'No se encontró una cuenta desactivada con este email'
        };
      }


      // Reactivar la cuenta
      const usuarioReactivated = await this.usuarioRepository.reactivate(usuario.id);


      return {
        success: true,
        cuenta_reactivada: true,
        message: 'Cuenta reactivada exitosamente',
        data: {
          usuario: usuarioReactivated
        }
      };

    } catch (error) {
      console.error('Error procesando recuperación:', error);
      return {
        success: false,
        status: 500,
        message: 'Error al procesar la recuperación: ' + error.message
      };
    }
  }
}

module.exports = ProcesarRecuperacionCuenta;