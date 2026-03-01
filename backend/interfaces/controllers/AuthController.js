// backend/interfaces/controllers/AuthController.js
class AuthController {
  constructor(
    registrarUsuarioUseCase,
    loginUsuarioUseCase,
    refrescarTokenUseCase,
    cerrarSesionUseCase,
    obtenerSesionUseCase
  ) {
     this.registrarUsuario = registrarUsuarioUseCase; 
    this.loginUsuario = loginUsuarioUseCase;
    this.refrescarToken = refrescarTokenUseCase;
    this.cerrarSesion = cerrarSesionUseCase;
    this.obtenerSesion = obtenerSesionUseCase;
  }
  async registrar(req, res) {
    const result = await this.registrarUsuario.execute(req.body);
    return res.status(result.status || (result.success ? 201 : 500)).json(result);
  }
  async login(req, res) {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await this.loginUsuario.execute({
      email,
      password,
      ipAddress,
      userAgent
    });

    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async refreshToken(req, res) {
    const { refresh_token } = req.body;

    const result = await this.refrescarToken.execute({ refresh_token });
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async logout(req, res) {
    const result = await this.cerrarSesion.execute();
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async getSession(req, res) {
    const result = await this.obtenerSesion.execute();
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }
}

module.exports = AuthController;