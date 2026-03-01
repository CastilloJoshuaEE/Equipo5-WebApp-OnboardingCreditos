// backend/infrastructure/repositories/SupabaseSolicitanteRepository.js
const SolicitanteRepository = require('../../domain/repositories/SolicitanteRepository');
const Solicitante = require('../../domain/entities/Solicitante');

class SupabaseSolicitanteRepository extends SolicitanteRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async create(solicitanteData) {
    const { data, error } = await this.supabase
      .from('solicitantes')
      .insert([solicitanteData])
      .select()
      .single();

    if (error) throw new Error(`Error creando solicitante: ${error.message}`);
    return new Solicitante(data);
  }

  async update(id, updates) {
    const { data, error } = await this.supabase
      .from('solicitantes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando solicitante: ${error.message}`);
    return new Solicitante(data);
  }

  async findByUserId(userId) {
    const { data, error } = await this.supabase
      .from('solicitantes')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new Error('Solicitante no encontrado');
    return new Solicitante(data);
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('solicitantes')
      .select(`
        *,
        usuarios: usuarios!inner(
          nombre_completo,
          email,
          telefono,
          cuenta_activa
        )
      `);

    if (error) throw new Error(`Error obteniendo solicitantes: ${error.message}`);
    return data.map(s => new Solicitante(s));
  }

  async findByCuit(cuit) {
    const { data, error } = await this.supabase
      .from('solicitantes')
      .select('*')
      .eq('cuit', cuit)
      .maybeSingle();

    if (error) throw error;
    return data ? new Solicitante(data) : null;
  }

  async getSolicitanteWithUsuario(id) {
    const { data, error } = await this.supabase
      .from('solicitantes')
      .select(`
        *,
        usuarios: usuarios(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = SupabaseSolicitanteRepository;