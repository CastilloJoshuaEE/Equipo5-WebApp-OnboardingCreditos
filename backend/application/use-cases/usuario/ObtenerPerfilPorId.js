// backend/application/use-cases/usuario/ObtenerPerfilPorId.js
class ObtenerPerfilPorId {
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

    const userProfile = await this.usuarioRepository.getProfileWithRoleData(id);

    if (!userProfile) {
      return {
        success: false,
        status: 404,
        message: 'Usuario no encontrado'
      };
    }

    return {
      success: true,
      data: userProfile
    };
  }
}

module.exports = ObtenerPerfilPorId;