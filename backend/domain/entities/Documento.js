// backend/domain/entities/Documento.js
class Documento {
  constructor(data = {}) {
    this.id = data.id || null;
    this.solicitud_id = data.solicitud_id || null;
    this.tipo = data.tipo || '';
    this.nombre_archivo = data.nombre_archivo || '';
    this.ruta_storage = data.ruta_storage || '';
    this.tamanio_bytes = data.tamanio_bytes || 0;
    this.estado = data.estado || 'pendiente';
    this.comentarios = data.comentarios || null;
    this.informacion_extraida = data.informacion_extraida || null;
    this.validado_en = data.validado_en || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  static TIPOS_PERMITIDOS = [
    'dni', 'cuit', 'comprobante_domicilio', 'balance_contable', 
    'estado_financiero', 'declaracion_impuestos'
  ];

  static ESTADOS = {
    PENDIENTE: 'pendiente',
    VALIDADO: 'validado',
    RECHAZADO: 'rechazado'
  };

  validarTipo() {
    if (!Documento.TIPOS_PERMITIDOS.includes(this.tipo)) {
      throw new Error(`Tipo de documento no válido. Permitidos: ${Documento.TIPOS_PERMITIDOS.join(', ')}`);
    }
    return true;
  }

  validar() {
    if (!this.solicitud_id) throw new Error('solicitud_id es requerido');
    if (!this.tipo) throw new Error('tipo es requerido');
    if (!this.nombre_archivo) throw new Error('nombre_archivo es requerido');
    this.validarTipo();
    return true;
  }

  validar(estado, comentarios = null) {
    if (![Documento.ESTADOS.VALIDADO, Documento.ESTADOS.RECHAZADO].includes(estado)) {
      throw new Error('Estado debe ser "validado" o "rechazado"');
    }
    this.estado = estado;
    this.comentarios = comentarios;
    this.validado_en = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  esDocumentoObligatorio() {
    return ['dni', 'cuit', 'comprobante_domicilio'].includes(this.tipo);
  }

  toJSON() {
    return {
      id: this.id,
      solicitud_id: this.solicitud_id,
      tipo: this.tipo,
      nombre_archivo: this.nombre_archivo,
      ruta_storage: this.ruta_storage,
      tamanio_bytes: this.tamanio_bytes,
      estado: this.estado,
      comentarios: this.comentarios,
      informacion_extraida: this.informacion_extraida,
      validado_en: this.validado_en,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Documento;