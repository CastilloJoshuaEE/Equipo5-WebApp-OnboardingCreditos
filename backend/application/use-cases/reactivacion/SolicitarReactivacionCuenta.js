// backend/application/use-cases/reactivacion/SolicitarReactivacionCuenta.js
const ReactivacionCuenta = require('../../../domain/entities/ReactivacionCuenta');

class SolicitarReactivacionCuenta {
  constructor(usuarioRepository, reactivacionCuentaRepository, emailService) {
    this.usuarioRepository = usuarioRepository;
    this.reactivacionCuentaRepository = reactivacionCuentaRepository;
    this.emailService = emailService;
  }

  async execute({ email }) {
    if (!email) {
      return {
        success: false,
        status: 400,
        message: 'Email es requerido'
      };
    }


    // Buscar usuario inactivo
    const usuario = await this.usuarioRepository.findInactiveByEmail(email);

    if (!usuario) {
      return {
        success: true,
        message: 'Si el email está registrado y la cuenta está inactiva, recibirás un enlace de reactivación.'
      };
    }


    // Generar token de reactivación
    const token = ReactivacionCuenta.generarToken(usuario.id, email);

    // Guardar solicitud en base de datos (opcional)
    const reactivacion = new ReactivacionCuenta({
      usuario_id: usuario.id,
      email: usuario.email,
      token
    });

    // Enviar email de reactivación
    try {
      const emailResult = await this.emailService.enviarEmailReactivacionCuenta(
        usuario.email,
        usuario.nombre_completo,
        usuario.id
      );

      if (emailResult.success) {
        return {
          success: true,
          message: 'Se ha enviado un enlace de reactivación a tu email. Por favor revisa tu bandeja de entrada.'
        };
      } else {
        throw new Error('Error enviando email de reactivación');
      }
    } catch (emailError) {
      console.error('Error enviando email de reactivación:', emailError);

      if (process.env.NODE_ENV === 'development') {
        console.log('Modo desarrollo: Reactivando cuenta directamente...');

        await this.usuarioRepository.reactivate(usuario.id);

        return {
          success: true,
          message: 'Cuenta reactivada exitosamente (modo desarrollo). Ya puedes iniciar sesión.',
          desarrollo: true
        };
      }

      throw new Error('No se pudo enviar el email de reactivación');
    }
  }
}

module.exports = SolicitarReactivacionCuenta;