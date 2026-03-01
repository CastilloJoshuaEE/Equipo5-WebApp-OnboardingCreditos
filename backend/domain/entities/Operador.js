// backend/domain/entities/Operador.js
class Operador {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nivel = data.nivel || 'analista';
    this.permisos = data.permisos || ['revision', 'aprobacion', 'rechazo'];
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  tienePermiso(permiso) {
    return this.permisos && this.permisos.includes(permiso);
  }

  esAdmin() {
    return this.nivel === 'admin';
  }

  esSupervisor() {
    return this.nivel === 'supervisor';
  }

  esAnalista() {
    return this.nivel === 'analista';
  }

  agregarPermiso(permiso) {
    if (!this.permisos.includes(permiso)) {
      this.permisos.push(permiso);
      this.updated_at = new Date().toISOString();
    }
  }

  quitarPermiso(permiso) {
    this.permisos = this.permisos.filter(p => p !== permiso);
    this.updated_at = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      nivel: this.nivel,
      permisos: this.permisos,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Operador;