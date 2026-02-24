// backend/domain/entities/ComprobanteTransferencia.js
class ComprobanteTransferencia {
  constructor(data = {}) {
    this.id = data.id || null;
    this.transferencia_id = data.transferencia_id || null;
    this.numero_comprobante = data.numero_comprobante || '';
    this.ruta_archivo = data.ruta_archivo || '';
    this.tamanio_bytes = data.tamanio_bytes || 0;
    this.generado_en = data.generado_en || new Date().toISOString();
    this.created_at = data.created_at || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      transferencia_id: this.transferencia_id,
      numero_comprobante: this.numero_comprobante,
      ruta_archivo: this.ruta_archivo,
      tamanio_bytes: this.tamanio_bytes,
      generado_en: this.generado_en,
      created_at: this.created_at
    };
  }
}

module.exports = ComprobanteTransferencia;