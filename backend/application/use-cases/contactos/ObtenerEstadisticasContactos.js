// backend/application/use-cases/contactos/ObtenerEstadisticasContactos.js
class ObtenerEstadisticasContactos {
  constructor(contactoBancarioRepository) {
    this.contactoBancarioRepository = contactoBancarioRepository;
  }

  async execute(usuario) {
    if (usuario.rol !== 'operador') {
      return {
        success: false,
        status: 403,
        message: 'Solo los operadores pueden ver estadísticas'
      };
    }

    const estadisticas = await this.contactoBancarioRepository.obtenerEstadisticas();

    return {
      success: true,
      data: estadisticas
    };
  }
}

module.exports = ObtenerEstadisticasContactos;