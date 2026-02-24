// backend/application/use-cases/usuario/ActualizarPerfilPorId.js
class ActualizarPerfilPorId {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id, data) {
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return {
        success: false,
        status: 400,
        message: 'ID de usuario no válido'
      };
    }

    const { nombre_completo, telefono, direccion, cuenta_activa, rol } = data;

    if (!nombre_completo && !telefono && !direccion && cuenta_activa === undefined && !rol) {
      return {
        success: false,
        status: 400,
        message: 'Debe proporcionar al menos un campo para actualizar'
      };
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (nombre_completo) updates.nombre_completo = nombre_completo;
    if (telefono) updates.telefono = telefono;
    if (direccion) updates.direccion = direccion;
    if (cuenta_activa !== undefined) updates.cuenta_activa = cuenta_activa;
    if (rol) updates.rol = rol;

    const updatedUser = await this.usuarioRepository.update(id, updates);

    return {
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedUser
    };
  }
}

module.exports = ActualizarPerfilPorId;