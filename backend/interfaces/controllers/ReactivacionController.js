// backend/interfaces/controllers/ReactivacionController.js
class ReactivacionController {
  constructor(
    solicitarReactivacionCuentaUseCase,
    reactivarCuentaUseCase,
    procesarRecuperacionCuentaUseCase
  ) {
    this._solicitarReactivacionCuenta = solicitarReactivacionCuentaUseCase;
    this._reactivarCuenta = reactivarCuentaUseCase;
    this._procesarRecuperacionCuenta = procesarRecuperacionCuentaUseCase;
  }

  static getFrontendUrl = () => {
    const env = process.env.NODE_ENV;
    if (env === 'production') {
      return (
        process.env.FRONTEND_URL ||
        'https://nexia-sigma.vercel.app' ||
        'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com'
      );
    }
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  };

  async solicitarReactivacionCuenta(req, res) {
    const result = await this._solicitarReactivacionCuenta.execute(req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async reactivarCuenta(req, res) {
    const result = await this._reactivarCuenta.execute(req.body);
    return res.status(result.status || (result.success ? 200 : 500)).json(result);
  }

  async procesarRecuperacionCuenta(req, res) {
    const result = await this._procesarRecuperacionCuenta.execute(req.query);

    return res.status(result.status || 400).json(result);
  }
}

module.exports = ReactivacionController;