// backend/domain/entities/ReactivacionCuenta.js
class ReactivacionCuenta {
  constructor(data = {}) {
    this.id = data.id || null;
    this.usuario_id = data.usuario_id || null;
    this.email = data.email || '';
    this.token = data.token || '';
    this.estado = data.estado || 'pendiente';
    this.fecha_solicitud = data.fecha_solicitud || new Date().toISOString();
    this.fecha_expiracion = data.fecha_expiracion || new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora
    this.fecha_reactivacion = data.fecha_reactivacion || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  static ESTADOS = {
    PENDIENTE: 'pendiente',
    COMPLETADO: 'completado',
    EXPIRADO: 'expirado'
  };

  estaExpirado() {
    return new Date(this.fecha_expiracion) < new Date();
  }

  estaPendiente() {
    return this.estado === ReactivacionCuenta.ESTADOS.PENDIENTE && !this.estaExpirado();
  }

  marcarComoCompletado() {
    this.estado = ReactivacionCuenta.ESTADOS.COMPLETADO;
    this.fecha_reactivacion = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  marcarComoExpirado() {
    this.estado = ReactivacionCuenta.ESTADOS.EXPIRADO;
    this.updated_at = new Date().toISOString();
  }

  verificarToken(token) {
    return this.token === token;
  }

  static generarToken(userId, email) {
    const timestamp = Date.now();
    const tokenData = `${userId}:${email}:${timestamp}:reactivacion`;
    return Buffer.from(tokenData).toString('base64');
  }

  static decodificarToken(token) {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const parts = decoded.split(':');
      if (parts.length < 4) {
        throw new Error('Formato de token inválido');
      }
      const [userId, email, timestamp] = parts;
      return {
        userId,
        email,
        timestamp: parseInt(timestamp),
        tokenData: decoded
      };
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  toJSON() {
    return {
      id: this.id,
      usuario_id: this.usuario_id,
      email: this.email,
      token: this.token,
      estado: this.estado,
      fecha_solicitud: this.fecha_solicitud,
      fecha_expiracion: this.fecha_expiracion,
      fecha_reactivacion: this.fecha_reactivacion,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = ReactivacionCuenta;