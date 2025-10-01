const { supabase } = require('../config/conexion.js');

class UsuarioSupabase {
  // Buscar usuario por email
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw new Error('Usuario no encontrado');
    return data;
  }

  // Buscar usuario por ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error('Usuario no encontrado');
    return data;
  }

  // Crear usuario (para uso interno, no para registro)
  static async create(usuarioData) {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([usuarioData])
      .select();

    if (error) throw new Error(`Error creando usuario: ${error.message}`);
    return data[0];
  }

  // Actualizar usuario
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw new Error(`Error actualizando usuario: ${error.message}`);
    return data[0];
  }
}

module.exports = UsuarioSupabase;