// backend/domain/entities/IntentoLogin.js
class IntentoLogin {
  constructor(data = {}) {
    this.id = data.id || null;
    this.usuario_id = data.usuario_id || null;
    this.email = data.email || '';
    this.intento_exitoso = data.intento_exitoso || false;
    this.ip_address = data.ip_address || '';
    this.user_agent = data.user_agent || '';
    this.bloqueado = data.bloqueado || false;
    this.created_at = data.created_at || new Date().toISOString();
  }

  static TIEMPO_BLOQUEO_MINUTOS = 15;
  static MAX_INTENTOS_FALLIDOS = 5;

  esFallido() {
    return !this.intento_exitoso;
  }

  esExitoso() {
    return this.intento_exitoso === true;
  }

  fueBloqueado() {
    return this.bloqueado === true;
  }

  static deberiaBloquear(intentosFallidosRecientes) {
    return intentosFallidosRecientes >= this.MAX_INTENTOS_FALLIDOS;
  }

  static tiempoRestanteBloqueo(primerIntento) {
    const tiempoTranscurrido = Date.now() - new Date(primerIntento).getTime();
    const tiempoBloqueoMs = this.TIEMPO_BLOQUEO_MINUTOS * 60 * 1000;
    const tiempoRestante = tiempoBloqueoMs - tiempoTranscurrido;
    return Math.max(0, Math.ceil(tiempoRestante / 1000 / 60));
  }

  toJSON() {
    return {
      id: this.id,
      usuario_id: this.usuario_id,
      email: this.email,
      intento_exitoso: this.intento_exitoso,
      ip_address: this.ip_address,
      user_agent: this.user_agent,
      bloqueado: this.bloqueado,
      created_at: this.created_at
    };
  }
}

module.exports = IntentoLogin;