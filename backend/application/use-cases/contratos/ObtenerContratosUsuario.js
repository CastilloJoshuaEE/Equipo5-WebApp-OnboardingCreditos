// backend/application/use-cases/contratos/ObtenerContratosUsuario.js
class ObtenerContratosUsuario {
  constructor(contratoRepository) {
    this.contratoRepository = contratoRepository;
  }

  async execute(usuarioId, usuarioRol, filtros = {}) {
    const { estado, tipo } = filtros;

    const filtrosAplicados = {};
    if (estado) filtrosAplicados.estado = estado;
    if (tipo) filtrosAplicados.tipo = tipo;

    const contratos = await this.contratoRepository.obtenerPorUsuario(usuarioId, usuarioRol, filtrosAplicados);

    return {
      success: true,
      data: contratos
    };
  }
}

module.exports = ObtenerContratosUsuario;