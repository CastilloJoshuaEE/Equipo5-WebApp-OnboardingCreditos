const UsuarioModel= require('./UsuarioModel');
const {supabase}=require('../config/conexion');
class OperadorModel extends UsuarioModel{
    //Crear operador
    static async create(operadorData){
        const{data, error} =await supabase
        .from('operadores')
        .insert([operadorData])
        .select()
        if(error) throw new Error(`Error creando operador: ${error.message}`);
        return data[0];

    }
    //Actualizar operador
    static async update(id, updates){
        const{data, error}= await supabase
        .from('operadores')
        .update(updates)
        .eq('id', id)
        .select();
        if(error) throw new Error(`Error actualizando operador:${error.message}`);
        return data[0];
    }
    //Obtener operador por ID de usuario
    static async findeByUserId(userId){
        const {data, error}=await supabase
        .from('operadores')
        .select('*')
        .eq('id', userId)
        .single();
        if(error) throw new Error('Operador no encontrado');
        return data;
    }
    //Obtener todos los operadores
    static async findAll(){
        const{data, error} = await supabase
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
        if(error) throw new Error(`Error obteniendo operadores: ${error.message}`);
        return data;
    }
    //Obtener operadores por nivel
    static async findByNivel(nivel){
        const{data, error}= await supabase
        .from('operadores')
        .select(`
            *,
            usuarios:usuarios!inner(
                nombre_completo,
                email
            )
            `)
            .eq('nivel', nivel);
        if(error) throw new Error(`Error obteniendo operadores por nivel: ${error.message}`);
        return data;
    }
    //Verificar permisos de operador
    static async hasPermission(userId, permission){
        const{data, error}= await supabase
        .from('operadores')
        .select('permisos')
        .eq('id', userId)
        .single();
        if(error) return false;
        return data.permisos && data.permisos.includes(permission);
    }

}
module.exports= OperadorModel;
