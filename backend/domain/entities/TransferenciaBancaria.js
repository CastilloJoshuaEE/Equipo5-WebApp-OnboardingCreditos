// backend/domain/entities/TransferenciaBancaria.js
class TransferenciaBancaria {
  constructor(data = {}) {
    this.id = data.id || null;
    this.solicitud_id = data.solicitud_id || null;
    this.contrato_id = data.contrato_id || null;
    this.contacto_bancario_id = data.contacto_bancario_id || null;
    this.numero_comprobante = data.numero_comprobante || '';
    this.monto = data.monto || 0;
    this.moneda = data.moneda || 'USD';
    this.cuenta_destino = data.cuenta_destino || '';
    this.banco_destino = data.banco_destino || '';
    this.motivo = data.motivo || '';
    this.costo_transferencia = data.costo_transferencia || 0;
    this.estado = data.estado || 'pendiente';
    this.ruta_comprobante = data.ruta_comprobante || null;
    this.procesado_por = data.procesado_por || null;
    this.fecha_procesamiento = data.fecha_procesamiento || null;
    this.fecha_completada = data.fecha_completada || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  static ESTADOS = {
    PENDIENTE: 'pendiente',
    PROCESANDO: 'procesando',
    COMPLETADA: 'completada',
    FALLIDA: 'fallida'
  };

  validar() {
    const errores = [];

    if (!this.solicitud_id) {
      errores.push('Solicitud ID es requerido');
    }

    if (!this.contacto_bancario_id) {
      errores.push('Contacto bancario ID es requerido');
    }

    if (!this.monto || this.monto <= 0) {
      errores.push('Monto válido es requerido');
    }

    if (!this.moneda) {
      errores.push('Moneda es requerida');
    }

    if (errores.length > 0) {
      throw new Error(`Datos de transferencia inválidos: ${errores.join(', ')}`);
    }

    return true;
  }

  estaCompletada() {
    return this.estado === TransferenciaBancaria.ESTADOS.COMPLETADA;
  }

  estaPendiente() {
    return this.estado === TransferenciaBancaria.ESTADOS.PENDIENTE;
  }

  estaProcesando() {
    return this.estado === TransferenciaBancaria.ESTADOS.PROCESANDO;
  }

  estaFallida() {
    return this.estado === TransferenciaBancaria.ESTADOS.FALLIDA;
  }

  marcarComoProcesando() {
    this.estado = TransferenciaBancaria.ESTADOS.PROCESANDO;
    this.updated_at = new Date().toISOString();
  }

  marcarComoCompletada(fechaCompletada = new Date().toISOString()) {
    this.estado = TransferenciaBancaria.ESTADOS.COMPLETADA;
    this.fecha_completada = fechaCompletada;
    this.updated_at = new Date().toISOString();
  }

  marcarComoFallida() {
    this.estado = TransferenciaBancaria.ESTADOS.FALLIDA;
    this.updated_at = new Date().toISOString();
  }

  asignarRutaComprobante(ruta) {
    this.ruta_comprobante = ruta;
    this.updated_at = new Date().toISOString();
  }

  static generarNumeroComprobante() {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `TRF-${timestamp}-${randomString}`;
  }

  toJSON() {
    return {
      id: this.id,
      solicitud_id: this.solicitud_id,
      contrato_id: this.contrato_id,
      contacto_bancario_id: this.contacto_bancario_id,
      numero_comprobante: this.numero_comprobante,
      monto: this.monto,
      moneda: this.moneda,
      cuenta_destino: this.cuenta_destino,
      banco_destino: this.banco_destino,
      motivo: this.motivo,
      costo_transferencia: this.costo_transferencia,
      estado: this.estado,
      ruta_comprobante: this.ruta_comprobante,
      procesado_por: this.procesado_por,
      fecha_procesamiento: this.fecha_procesamiento,
      fecha_completada: this.fecha_completada,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = TransferenciaBancaria;