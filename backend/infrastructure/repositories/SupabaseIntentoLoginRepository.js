// backend/infrastructure/repositories/SupabaseIntentoLoginRepository.js
const IntentoLoginRepository = require('../../domain/repositories/IntentoLoginRepository');
const IntentoLogin = require('../../domain/entities/IntentoLogin');

class SupabaseIntentoLoginRepository extends IntentoLoginRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async create(intentoData) {
    const { data, error } = await this.supabase
      .from('intentos_login')
      .insert([intentoData])
      .select()
      .single();

    if (error) throw new Error(`Error creando intento: ${error.message}`);
    return new IntentoLogin(data);
  }

  async findRecentFailures(email, minutos = 15) {
    const fechaLimite = new Date(Date.now() - minutos * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('intentos_login')
      .select('*')
      .eq('email', email)
      .eq('intento_exitoso', false)
      .gte('created_at', fechaLimite)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(i => new IntentoLogin(i));
  }

  async countRecentFailures(email, minutos = 15) {
    const intentos = await this.findRecentFailures(email, minutos);
    return intentos.length;
  }

  async deleteAllFailures(email) {
    const { data, error } = await this.supabase
      .from('intentos_login')
      .delete()
      .eq('email', email)
      .eq('intento_exitoso', false);

    if (error) throw error;
    return true;
  }

  async deleteOldFailures(email, minutos = 15) {
    const fechaLimite = new Date(Date.now() - minutos * 60 * 1000).toISOString();

    const { error } = await this.supabase
      .from('intentos_login')
      .delete()
      .eq('email', email)
      .eq('intento_exitoso', false)
      .lt('created_at', fechaLimite);

    if (error) throw error;
    return true;
  }

  async registerAttempt(email, usuarioId, exitoso, ip, userAgent, bloqueado = false) {
    const intentoData = {
      email,
      usuario_id: usuarioId,
      intento_exitoso: exitoso,
      ip_address: ip,
      user_agent: userAgent
    };

    return await this.create(intentoData);
  }

  async isBlocked(email) {
    const intentos = await this.findRecentFailures(email);

    const bloqueado = IntentoLogin.deberiaBloquear(intentos.length);

    if (bloqueado && intentos.length > 0) {
      const primerIntento = intentos[intentos.length - 1].created_at;
      const minutosRestantes = IntentoLogin.tiempoRestanteBloqueo(primerIntento);
      return { bloqueado: true, minutosRestantes };
    }

    return { bloqueado: false };
  }
}

module.exports = SupabaseIntentoLoginRepository;