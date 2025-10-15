const{supabase, supabaseAdmin}= require('../config/conexion');
class UsuarioModel{
  static async findByEmail(email){
    const{data, error}= await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single()
    if(error) throw new Error('Usuario no encontrado');
    return data;
  }
  static async findById(id){
    const{data, error}= await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single();
    if(error) throw new Error('Usuario no encontrado');
    return data;
  }
  //Crear usuario
  static async create(usuarioData){
    const{data, error}= await supabase
    .from('usuarios')
    .insert([usuarioData])
    .select();
    if(error) throw new Error(`Error creando usuario: ${error.message}`);
    return data[0];
  }
  //Actualizar usuario
  static async update(id, updates){
    const{data, error}= await supabase 
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select();
    if(error) throw new Error(`Error actualizando usuario: ${error.message}`);
    return data[0];


  }
  static async findInactiveByEmail(email){
    const{data, error}= await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .eq('cuenta_activa', false)
    .single();
    if(error) return null;
    return data;
  }
  //Activar cuenta
  static async activateAccount(email){
    const{data, error}=await supabase
    .from('usuarios')
    .update({
      cuenta_activa: true,
      update_at: new Date().toISOString()
    })
    .eq('email', email)
    .select();
    if(error) throw new Error(`Error activando cuenta: ${error.message}`);
    return data[0];
  }
  //Desactivar cuenta
  static async deactivateAccount(userId, motivo=''){
    const{ data, error}= await supabase
    .from('usuarios')
    .update({
      cuenta_activa: false,
      fecha_desactivacion: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();
    if(error) throw new Error(`Error desactivando cuenta: ${error.message}`);
    return data[0];
  }
  //Actualizar email de recuperación
  static async updateRecoveryEmail(userId, emailRecuperacion){
    const{data, error}= await supabase
    .from('usuarios')
    .update({
      email_recuperacion: emailRecuperacion,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select();
    if(error) throw new Error(`Error actualizando email de recuperación: ${error.message}`);
    return data[0];
  }
  //Verificar existencia de usuario
  static async exists(email){
    const {data, error}= await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email)
    .single();
    return !error && data !== null;
  }
  //Obtener perfil completo con datos especificos del rol
  static async getProfileWithRoleData(userId){
    const { data: usuario, error}= await supabase
    .from('usuarios')
    .select(`
      *,
      solicitantes(*),
      operadores (*)
      `)
    .eq('id', userId)
    .single();
    if(error) throw new Error(`Error obteniendo perfil: ${error.message}`);
    return usuario;
  }
}
module.exports= UsuarioModel;