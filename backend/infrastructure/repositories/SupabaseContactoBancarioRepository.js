// backend/infrastructure/repositories/SupabaseContactoBancarioRepository.js
const ContactoBancarioRepository = require('../../domain/repositories/ContactoBancarioRepository');
const ContactoBancario = require('../../domain/entities/ContactoBancario');

class SupabaseContactoBancarioRepository extends ContactoBancarioRepository {
  constructor(supabase, supabaseAdmin) {
    super();
    this.supabase = supabase;
    this.supabaseAdmin =supabaseAdmin;
  }

  async crear(contactoData) {
    const { data, error } = await this.supabaseAdmin
      .from('contactos_bancarios')
      .insert([contactoData])
      .select()
      .single();

    if (error) throw new Error(`Error creando contacto: ${error.message}`);
    return new ContactoBancario(data);
  }

  async actualizar(id, updateData) {
    const { data, error } = await this.supabaseAdmin
      .from('contactos_bancarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando contacto: ${error.message}`);
    return new ContactoBancario(data);
  }

  async eliminar(id) {
    const { data, error } = await this.supabase
      .from('contactos_bancarios')
      .update({
        estado: 'inactivo',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error eliminando contacto: ${error.message}`);
    return new ContactoBancario(data);
  }

  async obtenerPorId(id) {
    const { data, error } = await this.supabase
      .from('contactos_bancarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return new ContactoBancario(data);
  }

  async obtenerTodos(activos = true) {
    let query = this.supabaseAdmin
      .from('contactos_bancarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (activos) {
      query = query.eq('estado', 'activo');
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error obteniendo contactos: ${error.message}`);
    return data.map(c => new ContactoBancario(c));
  }

  async obtenerConSolicitantes() {
    const { data: contactos, error: contactosError } = await this.supabaseAdmin
      .from('contactos_bancarios')
      .select('*')
      .eq('estado', 'activo')
      .order('created_at', { ascending: false });

    if (contactosError) throw contactosError;

    if (!contactos || contactos.length === 0) {
      return [];
    }

    const solicitantesIds = [...new Set(contactos.map(c => c.solicitante_id))];

    const { data: solicitantes, error: solicitantesError } = await this.supabaseAdmin
      .from('solicitantes')
      .select(`
        id,
        usuario_id,
        usuarios (
          nombre_completo,
          dni,
          email
        )
      `)
      .in('id', solicitantesIds);

    if (solicitantesError) throw solicitantesError;

    const solicitantesMap = {};
    solicitantes?.forEach(sol => {
      solicitantesMap[sol.id] = {
        nombre_completo: sol.usuarios?.nombre_completo,
        dni: sol.usuarios?.dni,
        email: sol.usuarios?.email
      };
    });

    const contactosProcesados = contactos.map(contacto => {
      const infoSolicitante = solicitantesMap[contacto.solicitante_id] || {};

      return {
        id: contacto.id,
        numero_cuenta: contacto.numero_cuenta,
        tipo_cuenta: contacto.tipo_cuenta,
        moneda: contacto.moneda,
        nombre_banco: contacto.nombre_banco,
        email_contacto: contacto.email_contacto,
        telefono_contacto: contacto.telefono_contacto,
        estado: contacto.estado,
        created_at: contacto.created_at,
        updated_at: contacto.updated_at,
        solicitante_id: contacto.solicitante_id,
        solicitante_nombre: infoSolicitante.nombre_completo,
        solicitante_dni: infoSolicitante.dni,
        solicitante_email: infoSolicitante.email
      };
    });

    contactosProcesados.sort((a, b) =>
      (a.solicitante_nombre || '').localeCompare(b.solicitante_nombre || '')
    );

    return contactosProcesados;
  }

  async buscarPorNumeroCuenta(numero_cuenta) {
    const { data, error } = await this.supabase
      .from('contactos_bancarios')
      .select('*')
      .ilike('numero_cuenta', `%${numero_cuenta}%`)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error buscando contactos: ${error.message}`);
    return data.map(c => new ContactoBancario(c));
  }

  async buscarAvanzado(criterios = {}) {
    let query = this.supabase
      .from('contactos_bancarios')
      .select('*')
      .eq('estado', 'activo');

    if (criterios.numero_cuenta) {
      query = query.ilike('numero_cuenta', `%${criterios.numero_cuenta}%`);
    }

    if (criterios.nombre_banco) {
      query = query.ilike('nombre_banco', `%${criterios.nombre_banco}%`);
    }

    if (criterios.tipo_cuenta) {
      query = query.eq('tipo_cuenta', criterios.tipo_cuenta);
    }

    if (criterios.moneda) {
      query = query.eq('moneda', criterios.moneda);
    }

    if (criterios.email_contacto) {
      query = query.ilike('email_contacto', `%${criterios.email_contacto}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw new Error(`Error en búsqueda avanzada: ${error.message}`);
    return data.map(c => new ContactoBancario(c));
  }

  async existeNumeroCuenta(numero_cuenta, excludeId = null) {
    let query = this.supabase
      .from('contactos_bancarios')
      .select('id', { count: 'exact', head: true })
      .eq('numero_cuenta', numero_cuenta)
      .eq('estado', 'activo');

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { count, error } = await query;

    if (error) throw new Error(`Error verificando número de cuenta: ${error.message}`);
    return count > 0;
  }

  async obtenerSolicitantePorEmail(email) {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id, rol')
      .eq('email', email)
      .eq('rol', 'solicitante')
      .single();

    if (error) return null;
    return data;
  }

  async obtenerEstadisticas() {
    const { count: total, error: totalError } = await this.supabase
      .from('contactos_bancarios')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo');

    if (totalError) throw totalError;

    const { count: ahorros, error: ahorrosError } = await this.supabase
      .from('contactos_bancarios')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo')
      .eq('tipo_cuenta', 'ahorros');

    if (ahorrosError) throw ahorrosError;

    const { count: corriente, error: corrienteError } = await this.supabase
      .from('contactos_bancarios')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo')
      .eq('tipo_cuenta', 'corriente');

    if (corrienteError) throw corrienteError;

    return {
      total: total || 0,
      ahorros: ahorros || 0,
      corriente: corriente || 0
    };
  }
}

module.exports = SupabaseContactoBancarioRepository;