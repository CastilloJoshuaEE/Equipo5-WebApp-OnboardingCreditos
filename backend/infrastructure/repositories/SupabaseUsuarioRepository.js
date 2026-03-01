//backend/infrastructure/repositories/SupabaseUsuarioRepository.js
const UsuarioRepository = require('../../domain/repositories/UsuarioRepository');
const Usuario = require('../../domain/entities/Usuario');

class SupabaseUsuarioRepository extends UsuarioRepository {
  constructor(supabase, supabaseAdmin) {
    super();
    this.supabase = supabase;
    this.supabaseAdmin = supabaseAdmin;
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? new Usuario(data) : null;
  }

  async findByEmail(email) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data ? new Usuario(data) : null;
  }

  async findInactiveByEmail(email) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('cuenta_activa', false)
      .maybeSingle();

    if (error) return null;
    return data ? new Usuario(data) : null;
  }

  async create(usuarioData) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .insert([usuarioData])
      .select()
      .single();

    if (error) throw new Error(`Error creando usuario: ${error.message}`);
    return new Usuario(data);
  }

  async update(id, updates) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando usuario: ${error.message}`);
    return new Usuario(data);
  }

  async deactivate(id, motivo) {
    const updates = {
      cuenta_activa: false,
      fecha_desactivacion: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error desactivando usuario: ${error.message}`);
    return new Usuario(data);
  }

  async reactivate(id) {
    const updates = {
      cuenta_activa: true,
      fecha_desactivacion: null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error reactivando usuario: ${error.message}`);
    return new Usuario(data);
  }

  async updateRecoveryEmail(id, emailRecuperacion) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .update({
        email_recuperacion: emailRecuperacion,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando email recuperación: ${error.message}`);
    return new Usuario(data);
  }

  async findAll(filtros = {}, paginacion = {}) {
    let query = this.supabase
      .from('usuarios')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    const { rol, cuenta_activa } = filtros;
    const { page = 1, limit = 10 } = paginacion;

    if (rol) query = query.eq('rol', rol);
    if (cuenta_activa !== undefined) query = query.eq('cuenta_activa', cuenta_activa === 'true');

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data.map(u => new Usuario(u)),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async search(criterios) {
    const { query: searchQuery, rol, campo = 'nombre_completo' } = criterios;

    let supabaseQuery = this.supabase
      .from('usuarios')
      .select('*')
      .ilike(campo, `%${searchQuery}%`)
      .limit(20);

    if (rol) supabaseQuery = supabaseQuery.eq('rol', rol);

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return data.map(u => new Usuario(u));
  }

  async getProfileWithRoleData(id) {
    const { data: usuario, error } = await this.supabase
      .from('usuarios')
      .select(`
        *,
        solicitantes(*),
        operadores(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`Error obteniendo perfil: ${error.message}`);
    return usuario;
  }

  async exists(email) {
    const usuario = await this.findByEmail(email);
    return usuario !== null && usuario.cuenta_activa === true;
  }
}

module.exports = SupabaseUsuarioRepository;