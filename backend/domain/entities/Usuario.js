// backend/domain/entities/Usuario.js
class Usuario {
  constructor(data = {}) {
    this.id = data.id || null;
    this.email = data.email || '';
    this.nombre_completo = data.nombre_completo || '';
    this.telefono = data.telefono || '';
    this.dni = data.dni || '';
    this.rol = data.rol || 'solicitante';
    this.cuenta_activa = data.cuenta_activa !== undefined ? data.cuenta_activa : false;
    this.password_hash = data.password_hash || '';
    this.email_recuperacion = data.email_recuperacion || null;
    this.fecha_desactivacion = data.fecha_desactivacion || null;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  validarEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email || !emailRegex.test(this.email)) {
      throw new Error('Formato de email inválido');
    }
  }

  validarPassword(password) {
    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('La contraseña debe contener al menos una letra minúscula');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('La contraseña debe contener al menos una letra mayúscula');
    }
    if (!/(?=.*\d)/.test(password)) {
      throw new Error('La contraseña debe contener al menos un número');
    }
    return true;
  }

  validarNombreCompleto() {
    if (!this.nombre_completo || this.nombre_completo.trim().length < 2) {
      throw new Error('Nombre completo debe tener al menos 2 caracteres');
    }
    return true;
  }

  validarDNI() {
    if (!this.dni || this.dni.trim().length < 7) {
      throw new Error('DNI inválido');
    }
    return true;
  }

  validarTelefono() {
    if (this.telefono) {
      const telefonoLimpio = this.telefono.replace(/[\s\-\(\)]/g, '');
      const telefonoRegex = /^(\+?\d{1,4})?[\s\-]?\(?(\d{1,4})?\)?[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})$/;
      if (!telefonoRegex.test(this.telefono)) {
        throw new Error('Formato de teléfono inválido');
      }
      const soloNumeros = telefonoLimpio.replace(/\D/g, '');
      if (soloNumeros.length < 8 || soloNumeros.length > 15) {
        throw new Error('El teléfono debe tener entre 8 y 15 dígitos');
      }
    }
    return true;
  }

  activar() {
    this.cuenta_activa = true;
    this.fecha_desactivacion = null;
    this.updated_at = new Date().toISOString();
  }

  desactivar(motivo = null) {
    this.cuenta_activa = false;
    this.fecha_desactivacion = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  esOperador() {
    return this.rol === 'operador';
  }

  esSolicitante() {
    return this.rol === 'solicitante';
  }

  puedeAcceder() {
    return this.cuenta_activa === true;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      nombre_completo: this.nombre_completo,
      telefono: this.telefono,
      dni: this.dni,
      rol: this.rol,
      cuenta_activa: this.cuenta_activa,
      email_recuperacion: this.email_recuperacion,
      fecha_desactivacion: this.fecha_desactivacion,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Usuario;