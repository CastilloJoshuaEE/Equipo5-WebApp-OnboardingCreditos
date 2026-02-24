// backend/domain/entities/Solicitante.js
class Solicitante {
  constructor(data = {}) {
    this.id = data.id || null;
    this.tipo = data.tipo || 'empresa';
    this.nombre_empresa = data.nombre_empresa || '';
    this.cuit = data.cuit || '';
    this.representante_legal = data.representante_legal || '';
    this.domicilio = data.domicilio || '';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  validarCUIT() {
    if (!this.cuit || !/^\d{2}-\d{8}-\d{1}$/.test(this.cuit)) {
      throw new Error('CUIT no válido. Formato: 30-12345678-9');
    }
    return true;
  }

  validarNombreEmpresa() {
    if (!this.nombre_empresa || this.nombre_empresa.trim().length < 2) {
      throw new Error('Nombre de empresa debe tener al menos 2 caracteres');
    }
    return true;
  }

  validarRepresentanteLegal() {
    if (!this.representante_legal || this.representante_legal.trim().length < 2) {
      throw new Error('Representante legal debe tener al menos 2 caracteres');
    }
    return true;
  }

  validarDomicilio() {
    if (!this.domicilio || this.domicilio.trim().length < 5) {
      throw new Error('Domicilio debe tener al menos 5 caracteres');
    }
    return true;
  }

  static validarEmpresaData(data) {
    const errors = [];
    if (!data.nombre_empresa || data.nombre_empresa.trim().length < 2) {
      errors.push('Nombre de empresa es requerido');
    }
    if (!data.cuit || !/^\d{2}-\d{8}-\d{1}$/.test(data.cuit)) {
      errors.push('CUIT no válido. Formato: 30-12345678-9');
    }
    if (!data.representante_legal || data.representante_legal.trim().length < 2) {
      errors.push('Representante legal es requerido');
    }
    if (!data.domicilio || data.domicilio.trim().length < 5) {
      errors.push('Domicilio es requerido');
    }
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      tipo: this.tipo,
      nombre_empresa: this.nombre_empresa,
      cuit: this.cuit,
      representante_legal: this.representante_legal,
      domicilio: this.domicilio,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Solicitante;