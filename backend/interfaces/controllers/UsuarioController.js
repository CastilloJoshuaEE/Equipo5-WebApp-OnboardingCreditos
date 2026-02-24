// backend/interfaces/controllers/UsuarioController.js
class UsuarioController {
  constructor(
    obtenerPerfilUseCase,
    obtenerPerfilPorIdUseCase,
    obtenerPerfilUsuarioUseCase,
    actualizarPerfilUseCase,
    actualizarPerfilPorIdUseCase,
    cambiarContrasenaUseCase,
    recuperarContrasenaUseCase,
    solicitarRecuperacionCuentaUseCase,
    desactivarCuentaUseCase,
    actualizarEmailRecuperacionUseCase,
    verificarEstadoCuentaUseCase,
    obtenerConfiguracionCuentaUseCase,
    eliminarCuentaUseCase,
    gestionUsuariosUseCase
  ) {
    this._obtenerPerfil = obtenerPerfilUseCase;
    this._obtenerPerfilPorId = obtenerPerfilPorIdUseCase;
    this._obtenerPerfilUsuario = obtenerPerfilUsuarioUseCase;
    this._actualizarPerfil = actualizarPerfilUseCase;
    this._actualizarPerfilPorId = actualizarPerfilPorIdUseCase;
    this._cambiarContrasena = cambiarContrasenaUseCase;
    this._recuperarContrasena = recuperarContrasenaUseCase;
    this._solicitarRecuperacionCuenta = solicitarRecuperacionCuentaUseCase;
    this._desactivarCuenta = desactivarCuentaUseCase;
    this._actualizarEmailRecuperacion = actualizarEmailRecuperacionUseCase;
    this._verificarEstadoCuenta = verificarEstadoCuentaUseCase;
    this._obtenerConfiguracionCuenta = obtenerConfiguracionCuentaUseCase;
    this._eliminarCuenta = eliminarCuentaUseCase;
    this._gestionUsuarios = gestionUsuariosUseCase;
  }

  async registrar(req, res) {
    // Delegado al use case de RegistrarUsuario (inyectado en AuthController o similar)
    // Si se necesita aquí, pasar el use case correspondiente
    return res.status(501).json({ success: false, message: 'No implementado' });
  }

  async login(req, res) {
    return res.status(501).json({ success: false, message: 'No implementado' });
  }

  async logout(req, res) {
    return res.status(501).json({ success: false, message: 'No implementado' });
  }

  async getSession(req, res) {
    return res.status(501).json({ success: false, message: 'No implementado' });
  }

  async estadoConfirmacionEmail(req, res) {
    return res.status(501).json({ success: false, message: 'No implementado' });
  }

  async obtenerPerfilPropio(req, res) {
    const usuarioId = req.usuario.id;
    const result = await this._obtenerPerfil.execute(usuarioId);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerPerfilPorId(req, res) {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ success: false, message: 'ID de usuario no válido' });
    }
    const result = await this._obtenerPerfilPorId.execute(id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerPerfilUsuario(req, res) {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ success: false, message: 'ID de usuario no válido' });
    }
    const result = await this._obtenerPerfilUsuario.execute(id);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async actualizarPerfilPropio(req, res) {
    const usuarioId = req.usuario.id;
    const result = await this._actualizarPerfil.execute(usuarioId, req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async actualizarPerfilPorId(req, res) {
    const { id } = req.params;
    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ success: false, message: 'ID de usuario no válido' });
    }
    const result = await this._actualizarPerfilPorId.execute(id, req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async cambiarContrasena(req, res) {
    const usuarioId = req.usuario.id;
    const email = req.usuario.email;
    const result = await this._cambiarContrasena.execute(usuarioId, email, req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async recuperarContrasena(req, res) {
    const result = await this._recuperarContrasena.execute(req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async solicitarRecuperacionCuenta(req, res) {
    const result = await this._solicitarRecuperacionCuenta.execute(req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async desactivarCuenta(req, res) {
    const usuarioId = req.usuario.id;
    const email = req.usuario.email;
    const result = await this._desactivarCuenta.execute(usuarioId, email, req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async eliminarCuenta(req, res) {
    const usuarioId = req.usuario.id;
    const email = req.usuario.email;
    const result = await this._eliminarCuenta.execute(usuarioId, email, req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerTodosUsuarios(req, res) {
    const result = await this._gestionUsuarios.obtenerTodos(req.query);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async buscarUsuarios(req, res) {
    const result = await this._gestionUsuarios.buscar(req.query);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async obtenerConfiguracionCuenta(req, res) {
    const usuarioId = req.usuario.id;
    const result = await this._obtenerConfiguracionCuenta.execute(usuarioId);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async actualizarEmailRecuperacion(req, res) {
    const usuarioId = req.usuario.id;
    const emailPrincipal = req.usuario.email;
    const result = await this._actualizarEmailRecuperacion.execute(usuarioId, emailPrincipal, req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async verificarEstadoCuenta(req, res) {
    const usuarioId = req.usuario.id;
    const result = await this._verificarEstadoCuenta.execute(usuarioId);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = UsuarioController;