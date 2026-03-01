// backend/application/use-cases/usuario/CambiarContrasena.js
const bcrypt = require('bcryptjs');

class CambiarContrasena {
  constructor(usuarioRepository, authService, supabase) {
    this.usuarioRepository = usuarioRepository;
    this.authService = authService;
    this.supabase = supabase;
  }

  async execute(usuarioId, email, { contrasena_actual, nueva_contrasena, confirmar_contrasena }) {
    if (!contrasena_actual || !nueva_contrasena || !confirmar_contrasena) {
      return {
        success: false,
        status: 400,
        message: 'Contraseña actual, nueva contraseña y confirmación son requeridos',
        detalles: {
          campos_recibidos: {
            contrasena_actual: !!contrasena_actual,
            nueva_contrasena: !!nueva_contrasena,
            confirmar_contrasena: !!confirmar_contrasena
          },
          campos_esperados: ['contrasena_actual', 'nueva_contrasena', 'confirmar_contrasena']
        }
      };
    }

    if (nueva_contrasena !== confirmar_contrasena) {
      return {
        success: false,
        status: 400,
        message: 'Las nuevas contraseñas no coinciden'
      };
    }

    if (nueva_contrasena.length < 8) {
      return {
        success: false,
        status: 400,
        message: 'La contraseña debe tener al menos 8 caracteres'
      };
    }

    if (contrasena_actual === nueva_contrasena) {
      return {
        success: false,
        status: 400,
        message: 'La nueva contraseña debe ser diferente a la actual'
      };
    }

    const { data: historial, error: historialError } = await this.supabase
      .from('historial_contrasenas')
      .select('password_hash')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!historialError && historial) {
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

    const verifyResult = await this.authService.signInWithPassword(email, contrasena_actual);

    if (!verifyResult.success) {
      let errorMessage = 'La contraseña actual es incorrecta';
      if (verifyResult.error?.message?.includes('Invalid login credentials')) {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (verifyResult.error?.message?.includes('Email not confirmed')) {
        errorMessage = 'Tu email no está confirmado. Por favor verifica tu cuenta';
      }
      return {
        success: false,
        status: 400,
        message: errorMessage,
        code: 'VALIDATION_ERROR'
      };
    }

    const updateResult = await this.authService.updateUserPassword(nueva_contrasena);

    if (!updateResult.success) {
      let errorMessage = 'Error al actualizar la contraseña';
      if (updateResult.error?.message?.includes('password should be different')) {
        errorMessage = 'La nueva contraseña debe ser diferente a la anterior';
      } else if (updateResult.error?.message?.includes('weak_password')) {
        errorMessage = 'La contraseña es demasiado débil. Usa una combinación más segura';
      }
      return {
        success: false,
        status: 400,
        message: errorMessage,
        code: 'VALIDATION_ERROR'
      };
    }

    const nuevoHash = await this.generarHashContrasena(nueva_contrasena);
    await this.supabase
      .from('historial_contrasenas')
      .insert([{
        usuario_id: usuarioId,
        password_hash: nuevoHash
      }]);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente'
    };
  }

  async generarHashContrasena(contrasena) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(contrasena, salt);
  }
}

module.exports = CambiarContrasena;