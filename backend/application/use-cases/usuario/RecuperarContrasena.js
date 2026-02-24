// backend/application/use-cases/usuario/RecuperarContrasena.js
const bcrypt = require('bcryptjs');

class RecuperarContrasena {
  constructor(usuarioRepository, authService, supabase, intentoLoginRepository) {
    this.usuarioRepository = usuarioRepository;
    this.authService = authService;
    this.supabase = supabase;
    this.intentoLoginRepository = intentoLoginRepository;
  }

  async execute({ email, nueva_contrasena, confirmar_contrasena }) {
    if (!email || !nueva_contrasena || !confirmar_contrasena) {
      return {
        success: false,
        status: 400,
        message: 'Email, nueva contraseña y confirmación son requeridos'
      };
    }

    if (nueva_contrasena !== confirmar_contrasena) {
      return {
        success: false,
        status: 400,
        message: 'Las contraseñas no coinciden'
      };
    }

    if (nueva_contrasena.length < 8) {
      return {
        success: false,
        status: 400,
        message: 'La contraseña debe tener al menos 8 caracteres'
      };
    }

    const usuarioExistente = await this.usuarioRepository.findByEmail(email);

    if (!usuarioExistente) {
      return {
        success: false,
        status: 404,
        message: 'No hay una cuenta registrada con este email'
      };
    }

    if (!usuarioExistente.cuenta_activa) {
      return {
        success: false,
        status: 400,
        message: 'La cuenta no está activa. Por favor contacta al administrador'
      };
    }

    const { data: historial, error: historialError } = await this.supabase
      .from('historial_contrasenas')
      .select('password_hash')
      .eq('usuario_id', usuarioExistente.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!historialError && historial && historial.length > 0) {
      for (const item of historial) {
        const esIgual = await bcrypt.compare(nueva_contrasena, item.password_hash);
        if (esIgual) {
          return {
            success: false,
            status: 400,
            message: 'No puede reutilizar una contraseña anterior. Por favor elija una contraseña diferente.'
          };
        }
      }
    }

    const { error: updateError } = await this.authService.updateUserById(
      usuarioExistente.id,
      nueva_contrasena
    );

    if (updateError) {
      const { error: resetError } = await this.authService.resetPasswordForEmail(email);
      if (resetError) {
        throw new Error('No se pudo procesar la recuperación de contraseña');
      }
      return {
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu email. Por favor revisa tu bandeja de entrada'
      };
    }

    const nuevoHash = await this.generarHashContrasena(nueva_contrasena);
    await this.supabase
      .from('historial_contrasenas')
      .insert([{
        usuario_id: usuarioExistente.id,
        password_hash: nuevoHash
      }]);

    const limpiezaExitosa = await this.intentoLoginRepository.deleteAllFailures(email);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña',
      intentos_limpiados: limpiezaExitosa
    };
  }

  async generarHashContrasena(contrasena) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(contrasena, salt);
  }
}

module.exports = RecuperarContrasena;