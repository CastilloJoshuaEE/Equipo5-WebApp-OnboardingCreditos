// backend/infrastructure/repositories/SupabaseVerificacionKYCRepository.js
const VerificacionKYCRepository = require('../../domain/repositories/VerificacionKYCRepository');
const VerificacionKYC = require('../../domain/entities/VerificacionKYC');

class SupabaseVerificacionKYCRepository extends VerificacionKYCRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async crear(verificacionData) {
    const { data, error } = await this.supabase
      .from('verificaciones_kyc')
      .insert([verificacionData])
      .select()
      .single();

    if (error) throw new Error(`Error creando verificación KYC: ${error.message}`);
    return new VerificacionKYC(data);
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from('verificaciones_kyc')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error('Verificación KYC no encontrada');
    return new VerificacionKYC(data);
  }

  async findBySolicitudId(solicitudId) {
    const { data, error } = await this.supabase
      .from('verificaciones_kyc')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo verificaciones: ${error.message}`);
    return data.map(v => new VerificacionKYC(v));
  }

  async findBySessionId(sessionId) {
    const { data, error } = await this.supabase
      .from('verificaciones_kyc')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) throw new Error('Verificación KYC no encontrada');
    return new VerificacionKYC(data);
  }

  async update(id, updates) {
    const { data, error } = await this.supabase
      .from('verificaciones_kyc')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando verificación: ${error.message}`);
    return new VerificacionKYC(data);
  }

  async updateBySessionId(sessionId, updates) {
    const { data, error } = await this.supabase
      .from('verificaciones_kyc')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando verificación: ${error.message}`);
    return new VerificacionKYC(data);
  }

  async getEstadisticas() {
    const { data, error } = await this.supabase
      .from('verificaciones_kyc')
      .select('estado, proveedor');

    if (error) throw new Error(`Error obteniendo estadísticas: ${error.message}`);

    const estadisticas = {
      total: data.length,
      porEstado: {},
      porProveedor: {}
    };

    data.forEach(verificacion => {
      estadisticas.porEstado[verificacion.estado] = (estadisticas.porEstado[verificacion.estado] || 0) + 1;
      estadisticas.porProveedor[verificacion.proveedor] = (estadisticas.porProveedor[verificacion.proveedor] || 0) + 1;
    });

    return estadisticas;
  }
}

module.exports = SupabaseVerificacionKYCRepository;