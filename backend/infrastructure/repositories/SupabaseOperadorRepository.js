// backend/infrastructure/repositories/SupabaseOperadorRepository.js
const OperadorRepository = require('../../domain/repositories/OperadorRepository');
const Operador = require('../../domain/entities/Operador');

class SupabaseOperadorRepository extends OperadorRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async create(operadorData) {
    const { data, error } = await this.supabase
      .from('operadores')
      .insert([operadorData])
      .select()
      .single();

    if (error) throw new Error(`Error creando operador: ${error.message}`);
    return new Operador(data);
  }

  async update(id, updates) {
    const { data, error } = await this.supabase
      .from('operadores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando operador: ${error.message}`);
    return new Operador(data);
  }

  async findByUserId(userId) {
    const { data, error } = await this.supabase
      .from('operadores')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new Error('Operador no encontrado');
    return new Operador(data);
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('operadores')
      .select(`
        *,
        usuarios: usuarios!inner(
          nombre_completo,
          email,
          telefono,
          cuenta_activa
        )
      `);

    if (error) throw new Error(`Error obteniendo operadores: ${error.message}`);
    return data.map(o => new Operador(o));
  }

  async findByNivel(nivel) {
    const { data, error } = await this.supabase
      .from('operadores')
      .select(`
        *,
        usuarios:usuarios!inner(
          nombre_completo,
          email
        )
      `)
      .eq('nivel', nivel);

    if (error) throw new Error(`Error obteniendo operadores por nivel: ${error.message}`);
    return data.map(o => new Operador(o));
  }

  async hasPermission(userId, permission) {
    const { data, error } = await this.supabase
      .from('operadores')
      .select('permisos')
      .eq('id', userId)
      .single();

    if (error) return false;
    return data.permisos && data.permisos.includes(permission);
  }

  async getOperadorWithUsuario(id) {
    const { data, error } = await this.supabase
      .from('operadores')
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

module.exports = SupabaseOperadorRepository;