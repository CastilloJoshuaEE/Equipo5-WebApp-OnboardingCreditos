// backend/domain/entities/ComprobanteTransferencia.js
class ComprobanteTransferencia {
  constructor(data = {}) {
    this.id = data.id || null;
    this.transferencia_id = data.transferencia_id || null;
    this.numero_comprobante = data.numero_comprobante || '';
    this.monto = data.monto || 0;
    this.moneda = data.moneda || 'USD';
    this.estado = data.estado || 'pendiente';
    this.fecha_procesamiento = data.fecha_procesamiento || null;
    this.fecha_completada = data.fecha_completada || null;
    this.ruta_comprobante = data.ruta_comprobante || '';
    this.banco_destino = data.banco_destino || '';
    this.cuenta_destino = data.cuenta_destino || '';
    this.cuenta_origen = data.cuenta_origen || 'NEXIA-001-USD';
    this.banco_origen = data.banco_origen || 'Nexia Bank';
    this.motivo = data.motivo || '';
    this.costo_transferencia = data.costo_transferencia || 0;
    this.procesado_por = data.procesado_por || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();

    // Información adicional de relaciones
    this.solicitud_id = data.solicitud_id || null;
    this.contrato_id = data.contrato_id || null;
    this.contacto_bancario_id = data.contacto_bancario_id || null;

    // Datos de relaciones (cuando se incluyen en la consulta)
    this.contactos_bancarios = data.contactos_bancarios || null;
    this.solicitudes_credito = data.solicitudes_credito || null;
  }

  /**
   * Validar que el comprobante tenga los datos mínimos requeridos
   */
  validar() {
    if (!this.numero_comprobante || this.numero_comprobante.trim().length === 0) {
      throw new Error('El número de comprobante es requerido');
    }

    if (this.monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    if (!this.moneda || !['USD', 'ARS'].includes(this.moneda)) {
      throw new Error('La moneda debe ser USD o ARS');
    }

    if (!this.cuenta_destino || this.cuenta_destino.trim().length === 0) {
      throw new Error('La cuenta destino es requerida');
    }

    if (!this.ruta_comprobante || this.ruta_comprobante.trim().length === 0) {
      throw new Error('La ruta del comprobante es requerida');
    }

    return true;
  }

  /**
   * Verificar si el comprobante está pendiente
   */
  esPendiente() {
    return this.estado === 'pendiente';
  }

  /**
   * Verificar si el comprobante está en procesamiento
   */
  esProcesando() {
    return this.estado === 'procesando';
  }

  /**
   * Verificar si el comprobante está completado
   */
  esCompletado() {
    return this.estado === 'completada';
  }

  /**
   * Verificar si el comprobante falló
   */
  esFallido() {
    return this.estado === 'fallida';
  }

  /**
   * Verificar si el comprobante fue reversado
   */
  esReversado() {
    return this.estado === 'reversada';
  }

  /**
   * Marcar como completado
   */
  completar(fechaCompletada = new Date().toISOString()) {
    if (!this.esProcesando() && !this.esPendiente()) {
      throw new Error('Solo se pueden completar transferencias pendientes o en procesamiento');
    }
    this.estado = 'completada';
    this.fecha_completada = fechaCompletada;
    this.updated_at = new Date().toISOString();
  }

  /**
   * Marcar como fallido
   */
  fallar() {
    this.estado = 'fallida';
    this.updated_at = new Date().toISOString();
  }

  /**
   * Marcar como reversado
   */
  reversar() {
    this.estado = 'reversada';
    this.updated_at = new Date().toISOString();
  }

  /**
   * Iniciar procesamiento
   */
  iniciarProcesamiento(fechaProcesamiento = new Date().toISOString()) {
    if (!this.esPendiente()) {
      throw new Error('Solo se pueden procesar transferencias pendientes');
    }
    this.estado = 'procesando';
    this.fecha_procesamiento = fechaProcesamiento;
    this.updated_at = new Date().toISOString();
  }

  /**
   * Obtener información del contacto bancario
   */
  getContactoBancario() {
    return this.contactos_bancarios || null;
  }

  /**
   * Obtener nombre del banco destino
   */
  getBancoDestino() {
    return this.banco_destino || (this.contactos_bancarios?.nombre_banco) || 'No especificado';
  }

  /**
   * Obtener número de cuenta destino
   */
  getCuentaDestino() {
    return this.cuenta_destino || (this.contactos_bancarios?.numero_cuenta) || 'No especificado';
  }

  /**
   * Obtener monto formateado
   */
  getMontoFormateado() {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: this.moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this.monto);
  }

  /**
   * Obtener fecha formateada
   */
  getFechaFormateada() {
    if (!this.fecha_completada && !this.fecha_procesamiento && !this.created_at) {
      return 'Fecha no disponible';
    }

    const fecha = this.fecha_completada || this.fecha_procesamiento || this.created_at;
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Verificar si el comprobante es accesible por un usuario
   * @param {string} usuarioId - ID del usuario
   * @param {string} usuarioRol - Rol del usuario
   */
  esAccesiblePor(usuarioId, usuarioRol) {
    // Operadores pueden ver todos los comprobantes
    if (usuarioRol === 'operador') {
      return true;
    }

    // Solicitantes solo pueden ver sus propios comprobantes
    if (usuarioRol === 'solicitante') {
      return this.solicitudes_credito?.solicitante_id === usuarioId;
    }

    return false;
  }

  /**
   * Convertir a JSON para la respuesta API
   */
  toJSON() {
    return {
      id: this.id,
      transferencia_id: this.transferencia_id,
      numero_comprobante: this.numero_comprobante,
      monto: this.monto,
      moneda: this.moneda,
      monto_formateado: this.getMontoFormateado(),
      estado: this.estado,
      fecha_procesamiento: this.fecha_procesamiento,
      fecha_completada: this.fecha_completada,
      fecha_formateada: this.getFechaFormateada(),
      ruta_comprobante: this.ruta_comprobante,
      banco_destino: this.getBancoDestino(),
      cuenta_destino: this.getCuentaDestino(),
      cuenta_origen: this.cuenta_origen,
      banco_origen: this.banco_origen,
      motivo: this.motivo,
      costo_transferencia: this.costo_transferencia,
      solicitud_id: this.solicitud_id,
      contrato_id: this.contrato_id,
      contacto_bancario_id: this.contacto_bancario_id,
      contactos_bancarios: this.contactos_bancarios,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = ComprobanteTransferencia;