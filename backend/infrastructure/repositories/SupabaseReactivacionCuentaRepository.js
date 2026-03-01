// backend/infrastructure/repositories/SupabaseReactivacionCuentaRepository.js
const ReactivacionCuentaRepository = require('../../domain/repositories/ReactivacionCuentaRepository');
const ReactivacionCuenta = require('../../domain/entities/ReactivacionCuenta');

class SupabaseReactivacionCuentaRepository extends ReactivacionCuentaRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async crear(solicitudData) {
    const { data, error } = await this.supabase
      .from('reactivaciones_cuenta')
      .insert([solicitudData])
      .select()
      .single();

    if (error) throw new Error(`Error creando solicitud: ${error.message}`);
    return new ReactivacionCuenta(data);
  }

  async obtenerPorToken(token) {
    const { data, error } = await this.supabase
      .from('reactivaciones_cuenta')
      .select('*')
      .eq('token', token)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? new ReactivacionCuenta(data) : null;
  }

  async obtenerPorEmail(email) {
    const { data, error } = await this.supabase
      .from('reactivaciones_cuenta')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? new ReactivacionCuenta(data) : null;
  }

  async marcarComoCompletado(token) {
    const { data, error } = await this.supabase
      .from('reactivaciones_cuenta')
      .update({
        estado: 'completado',
        fecha_reactivacion: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('token', token)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando solicitud: ${error.message}`);
    return new ReactivacionCuenta(data);
  }

  async limpiarExpirados() {
    const { error } = await this.supabase
      .from('reactivaciones_cuenta')
      .update({
        estado: 'expirado',
        updated_at: new Date().toISOString()
      })
      .eq('estado', 'pendiente')
      .lt('fecha_expiracion', new Date().toISOString());

    if (error) throw error;
    return true;
  }
}

module.exports = SupabaseReactivacionCuentaRepository;