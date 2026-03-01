// backend/application/use-cases/usuario/ObtenerPerfilUsuario.js
class ObtenerPerfilUsuario {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id) {
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return {
        success: false,
        status: 400,
        message: 'ID de usuario no válido'
      };
    }

    const perfilCompleto = await this.usuarioRepository.getProfileWithRoleData(id);

    if (!perfilCompleto) {
      return {
        success: false,
        status: 404,
        message: 'Usuario no encontrado'
      };
    }

    const perfilPublico = {
      id: perfilCompleto.id,
      nombre_completo: perfilCompleto.nombre_completo,
      email: perfilCompleto.email,
      telefono: perfilCompleto.telefono,
      rol: perfilCompleto.rol,
      cuenta_activa: perfilCompleto.cuenta_activa,
      created_at: perfilCompleto.created_at
    };

    if (perfilCompleto.rol === 'solicitante' && perfilCompleto.solicitantes) {
      perfilPublico.datos_empresa = {
        nombre_empresa: perfilCompleto.solicitantes.nombre_empresa,
        cuit: perfilCompleto.solicitantes.cuit,
        representante_legal: perfilCompleto.solicitantes.representante_legal,
        domicilio: perfilCompleto.solicitantes.domicilio,
        tipo: perfilCompleto.solicitantes.tipo
      };
    } else if (perfilCompleto.rol === 'operador' && perfilCompleto.operadores) {
      perfilPublico.datos_operador = {
        nivel: perfilCompleto.operadores.nivel,
        permisos: perfilCompleto.operadores.permisos
      };
    }

    return {
      success: true,
      data: perfilPublico
    };
  }
}

module.exports = ObtenerPerfilUsuario;