// backend/domain/entities/SolicitudInformacion.js
class SolicitudInformacion {
  constructor(data = {}) {
    this.id = data.id || null;
    this.solicitud_id = data.solicitud_id || null;
    this.informacion_solicitada = data.informacion_solicitada || '';
    this.plazo_dias = data.plazo_dias || 7;
    this.estado = data.estado || 'pendiente';
    this.solicitado_por = data.solicitado_por || null;
    this.fecha_limite = data.fecha_limite || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  static ESTADOS = {
    PENDIENTE: 'pendiente',
    RESPONDIDA: 'respondida',
    VENCIDA: 'vencida'
  };

  estaVencida() {
    if (!this.fecha_limite) return false;
    return new Date(this.fecha_limite) < new Date();
  }

  puedeResponder() {
    return this.estado === SolicitudInformacion.ESTADOS.PENDIENTE && !this.estaVencida();
  }

  marcarComoRespondida() {
    this.estado = SolicitudInformacion.ESTADOS.RESPONDIDA;
    this.updated_at = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      solicitud_id: this.solicitud_id,
      informacion_solicitada: this.informacion_solicitada,
      plazo_dias: this.plazo_dias,
      estado: this.estado,
      solicitado_por: this.solicitado_por,
      fecha_limite: this.fecha_limite,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = SolicitudInformacion;