// backend/domain/entities/PlantillaDocumento.js
class PlantillaDocumento {
  constructor(data = {}) {
    this.id = data.id || null;
    this.tipo = data.tipo || 'contrato';
    this.nombre_archivo = data.nombre_archivo || '';
    this.ruta_storage = data.ruta_storage || '';
    this.tamanio_bytes = data.tamanio_bytes || 0;
    this.activa = data.activa || false;
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  static TIPOS_PERMITIDOS = ['contrato', 'autorizacion', 'carta', 'formulario'];

  validar() {
    const errores = [];

    if (!this.nombre_archivo) {
      errores.push('El nombre del archivo es requerido');
    }

    if (!this.ruta_storage) {
      errores.push('La ruta de storage es requerida');
    }

    if (!this.tipo) {
      errores.push('El tipo de plantilla es requerido');
    }

    if (this.tamanio_bytes && this.tamanio_bytes <= 0) {
      errores.push('El tamaño del archivo debe ser mayor a 0');
    }

    if (this.nombre_archivo && !this.nombre_archivo.toLowerCase().endsWith('.docx')) {
      errores.push('El archivo debe ser un documento Word (.docx)');
    }

    if (errores.length > 0) {
      throw new Error(`Datos de plantilla inválidos: ${errores.join(', ')}`);
    }

    return true;
  }

  activar() {
    this.activa = true;
    this.updated_at = new Date().toISOString();
  }

  desactivar() {
    this.activa = false;
    this.updated_at = new Date().toISOString();
  }

  actualizarTamanio(nuevoTamanio) {
    this.tamanio_bytes = nuevoTamanio;
    this.updated_at = new Date().toISOString();
  }

  esActiva() {
    return this.activa === true;
  }

  toJSON() {
    return {
      id: this.id,
      tipo: this.tipo,
      nombre_archivo: this.nombre_archivo,
      ruta_storage: this.ruta_storage,
      tamanio_bytes: this.tamanio_bytes,
      activa: this.activa,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = PlantillaDocumento;