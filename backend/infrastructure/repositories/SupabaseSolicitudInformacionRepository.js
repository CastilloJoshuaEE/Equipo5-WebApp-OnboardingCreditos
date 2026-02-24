// backend/infrastructure/repositories/SupabaseSolicitudInformacionRepository.js
const SolicitudInformacionRepository = require('../../domain/repositories/SolicitudInformacionRepository');
const SolicitudInformacion = require('../../domain/entities/SolicitudInformacion');

class SupabaseSolicitudInformacionRepository extends SolicitudInformacionRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async create(solicitudInfoData) {
    const { data, error } = await this.supabase
      .from('solicitudes_informacion')
      .insert([solicitudInfoData])
      .select()
      .single();

    if (error) throw new Error(`Error creando solicitud de información: ${error.message}`);
    return new SolicitudInformacion(data);
  }

  async findBySolicitudId(solicitudId) {
    const { data, error } = await this.supabase
      .from('solicitudes_informacion')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo solicitudes de información: ${error.message}`);
    return data.map(s => new SolicitudInformacion(s));
  }

  async findPendientes() {
    const { data, error } = await this.supabase
      .from('solicitudes_informacion')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error obteniendo solicitudes pendientes: ${error.message}`);
    return data.map(s => new SolicitudInformacion(s));
  }

  async marcarVencidas() {
    const { error } = await this.supabase
      .from('solicitudes_informacion')
      .update({
        estado: 'vencida',
        updated_at: new Date().toISOString()
      })
      .eq('estado', 'pendiente')
      .lt('fecha_limite', new Date().toISOString());

    if (error) throw error;
    return true;
  }
}

module.exports = SupabaseSolicitudInformacionRepository;