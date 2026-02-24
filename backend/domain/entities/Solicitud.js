// backend/domain/entities/Solicitud.js
class Solicitud {
  constructor(data = {}) {
    this.id = data.id || null;
    this.numero_solicitud = data.numero_solicitud || '';
    this.solicitante_id = data.solicitante_id || null;
    this.operador_id = data.operador_id || null;
    this.monto = data.monto || 0;
    this.plazo_meses = data.plazo_meses || 0;
    this.tasa_interes = data.tasa_interes || 0;
    this.estado = data.estado || 'borrador';
    this.nivel_riesgo = data.nivel_riesgo || 'medio';
    this.destino_fondos = data.destino_fondos || '';
    this.moneda = data.moneda || 'ARS';
    this.proposito = data.proposito || '';
    this.comentarios = data.comentarios || null;
    this.motivo_rechazo = data.motivo_rechazo || null;
    this.fecha_envio = data.fecha_envio || null;
    this.fecha_decision = data.fecha_decision || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  static ESTADOS = {
    BORRADOR: 'borrador',
    ENVIADO: 'enviado',
    EN_REVISION: 'en_revision',
    PENDIENTE_INFO: 'pendiente_info',
    APROBADO: 'aprobado',
    RECHAZADO: 'rechazado'
  };

  static NIVELES_RIESGO = {
    BAJO: 'bajo',
    MEDIO: 'medio',
    ALTO: 'alto'
  };

  validar() {
    if (!this.monto || this.monto <= 0) {
      throw new Error('Monto debe ser mayor a 0');
    }
    if (!this.plazo_meses || this.plazo_meses < 1) {
      throw new Error('Plazo en meses debe ser al menos 1');
    }
    if (!this.proposito || this.proposito.trim().length < 10) {
      throw new Error('Propósito debe tener al menos 10 caracteres');
    }
    return true;
  }

  puedeSerEnviada(documentosObligatoriosCompletos) {
    return this.estado === Solicitud.ESTADOS.BORRADOR && documentosObligatoriosCompletos;
  }

  puedeSerRevisada() {
    return this.estado === Solicitud.ESTADOS.ENVIADO;
  }

  puedeSerAprobada() {
    return [Solicitud.ESTADOS.EN_REVISION, Solicitud.ESTADOS.PENDIENTE_INFO].includes(this.estado);
  }

  iniciarRevision() {
    if (!this.puedeSerRevisada()) {
      throw new Error('La solicitud no puede ser revisada en su estado actual');
    }
    this.estado = Solicitud.ESTADOS.EN_REVISION;
    this.updated_at = new Date().toISOString();
  }

  asignarOperador(operadorId) {
    this.operador_id = operadorId;
    this.updated_at = new Date().toISOString();
  }

  aprobar(comentarios = null) {
    if (!this.puedeSerAprobada()) {
      throw new Error('La solicitud no puede ser aprobada en su estado actual');
    }
    this.estado = Solicitud.ESTADOS.APROBADO;
    this.comentarios = comentarios;
    this.fecha_decision = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  rechazar(motivo) {
    if (!this.puedeSerAprobada()) {
      throw new Error('La solicitud no puede ser rechazada en su estado actual');
    }
    this.estado = Solicitud.ESTADOS.RECHAZADO;
    this.motivo_rechazo = motivo;
    this.fecha_decision = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  solicitarInformacion(informacionSolicitada) {
    this.estado = Solicitud.ESTADOS.PENDIENTE_INFO;
    this.comentarios = `Información adicional solicitada: ${informacionSolicitada}`;
    this.updated_at = new Date().toISOString();
  }

  enviar() {
    this.estado = Solicitud.ESTADOS.ENVIADO;
    this.fecha_envio = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  calcularScoring(documentosValidados) {
    const puntajePorDocumento = 20;
    const scoring = documentosValidados * puntajePorDocumento;
    this.nivel_riesgo = this.calcularNivelRiesgo(scoring);
    return scoring;
  }

  calcularNivelRiesgo(scoring) {
    if (scoring >= 80) return Solicitud.NIVELES_RIESGO.BAJO;
    if (scoring >= 60) return Solicitud.NIVELES_RIESGO.MEDIO;
    return Solicitud.NIVELES_RIESGO.ALTO;
  }

  toJSON() {
    return {
      id: this.id,
      numero_solicitud: this.numero_solicitud,
      solicitante_id: this.solicitante_id,
      operador_id: this.operador_id,
      monto: this.monto,
      plazo_meses: this.plazo_meses,
      tasa_interes: this.tasa_interes,
      estado: this.estado,
      nivel_riesgo: this.nivel_riesgo,
      destino_fondos: this.destino_fondos,
      moneda: this.moneda,
      proposito: this.proposito,
      comentarios: this.comentarios,
      motivo_rechazo: this.motivo_rechazo,
      fecha_envio: this.fecha_envio,
      fecha_decision: this.fecha_decision,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Solicitud;