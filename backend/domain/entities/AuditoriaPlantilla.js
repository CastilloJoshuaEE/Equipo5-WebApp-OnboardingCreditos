// backend/domain/entities/AuditoriaPlantilla.js
class AuditoriaPlantilla {
  constructor(data = {}) {
    this.id = data.id || null;
    this.plantilla_id = data.plantilla_id || null;
    this.usuario_id = data.usuario_id || null;
    this.accion = data.accion || '';
    this.descripcion = data.descripcion || '';
    this.ip_address = data.ip_address || '';
    this.user_agent = data.user_agent || '';
    this.created_at = data.created_at || new Date().toISOString();
  }

  static ACCIONES = {
    SUBIR_PLANTILLA: 'subir_plantilla',
    ACTUALIZAR_PLANTILLA: 'actualizar_plantilla',
    ELIMINAR_PLANTILLA: 'eliminar_plantilla',
    ACTIVAR_PLANTILLA: 'activar_plantilla'
  };

  toJSON() {
    return {
      id: this.id,
      plantilla_id: this.plantilla_id,
      usuario_id: this.usuario_id,
      accion: this.accion,
      descripcion: this.descripcion,
      ip_address: this.ip_address,
      user_agent: this.user_agent,
      created_at: this.created_at
    };
  }
}

module.exports = AuditoriaPlantilla;