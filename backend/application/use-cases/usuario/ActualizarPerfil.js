// backend/application/use-cases/usuario/ActualizarPerfil.js
const Usuario = require('../../../domain/entities/Usuario');
const Solicitante = require('../../../domain/entities/Solicitante');

class ActualizarPerfil {
  constructor(usuarioRepository, solicitanteRepository) {
    this.usuarioRepository = usuarioRepository;
    this.solicitanteRepository = solicitanteRepository;
  }

  validarTelefono(telefono) {
    if (!telefono) return true;
    const usuarioTemp = new Usuario({ telefono });
    try {
      usuarioTemp.validarTelefono();
      return true;
    } catch {
      return false;
    }
  }

  async execute(usuarioId, data) {
    const camposVacios = !data.nombre_completo && !data.telefono && !data.direccion &&
                        !data.nombre_empresa && !data.cuit && !data.representante_legal && !data.domicilio;

    if (camposVacios) {
      return {
        success: false,
        status: 400,
        message: 'Debe proporcionar al menos un campo para actualizar'
      };
    }

    const usuarioActual = await this.usuarioRepository.findById(usuarioId);

    if (!usuarioActual) {
      return {
        success: false,
        status: 404,
        message: 'Usuario no encontrado'
      };
    }

    const updatesUsuario = {
      updated_at: new Date().toISOString()
    };

    if (data.nombre_completo) {
      if (data.nombre_completo.trim().length < 2) {
        return {
          success: false,
          status: 400,
          message: 'El nombre completo debe tener al menos 2 caracteres'
        };
      }
      updatesUsuario.nombre_completo = data.nombre_completo.trim();
    }

    if (data.telefono) {
      if (!this.validarTelefono(data.telefono)) {
        return {
          success: false,
          status: 400,
          message: 'Formato de teléfono inválido'
        };
      }
      updatesUsuario.telefono = data.telefono;
    }

    if (data.direccion) {
      updatesUsuario.direccion = data.direccion;
    }

    if (Object.keys(updatesUsuario).length > 1) {
      await this.usuarioRepository.update(usuarioId, updatesUsuario);
    }

    if (usuarioActual.rol === 'solicitante') {
      const updatesSolicitante = {
        updated_at: new Date().toISOString()
      };

      if (data.nombre_empresa) {
        if (data.nombre_empresa.trim().length < 2) {
          return {
            success: false,
            status: 400,
            message: 'El nombre de empresa debe tener al menos 2 caracteres'
          };
        }
        updatesSolicitante.nombre_empresa = data.nombre_empresa.trim();
      }

      if (data.cuit) {
        if (!/^\d{2}-\d{8}-\d{1}$/.test(data.cuit)) {
          return {
            success: false,
            status: 400,
            message: 'Formato de CUIT inválido. Use: 30-12345678-9'
          };
        }
        updatesSolicitante.cuit = data.cuit;
      }

      if (data.representante_legal) {
        if (data.representante_legal.trim().length < 2) {
          return {
            success: false,
            status: 400,
            message: 'El representante legal debe tener al menos 2 caracteres'
          };
        }
        updatesSolicitante.representante_legal = data.representante_legal.trim();
      }

      if (data.domicilio) {
        if (data.domicilio.trim().length < 5) {
          return {
            success: false,
            status: 400,
            message: 'El domicilio debe tener al menos 5 caracteres'
          };
        }
        updatesSolicitante.domicilio = data.domicilio.trim();
      }

      if (Object.keys(updatesSolicitante).length > 1) {
        await this.solicitanteRepository.update(usuarioId, updatesSolicitante);
      }
    }

    const perfilActualizado = await this.usuarioRepository.getProfileWithRoleData(usuarioId);

    return {
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: perfilActualizado
    };
  }
}

module.exports = ActualizarPerfil;