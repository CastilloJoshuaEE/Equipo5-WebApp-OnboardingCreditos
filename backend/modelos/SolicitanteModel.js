const UsuarioModel=require('./UsuarioModel');
const {supabase}= require('../config/conexion');
class SolicitanteModel extends UsuarioModel{
    //Crear solicitante
    static async create(solicitanteData){
        const { data, error} = await supabase
        .from('solicitantes')
        .insert([solicitanteData])
        .select();
        if(error) throw new Error(`Error creando solicitante: ${error.message}`);
        return data[0];

    }
    //Actualizar solicitante
    static async update(id, updates){
        const{ data, error}= await supabase
        .from('solicitantes')
        .update(updates)
        .eq('id', id)
        .select();
        if(error) throw new Error(`Error actualizando solicitante ${error.message}`);
        return data[0];
    }
    //Obtener solicitante por ID de usuario
    static async findByUserId(userId){
        const{data, error}= await supabase
        .from('solicitantes')
        .select('*')
        .eq('id', userId)
        .single();
        if(error) throw new Error('Solicitante no encontrado');
        return data;
    }
    //Obtener todas las empresas solicitantes
    static async findAll(){
        const{data, error}= await supabase
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
        if(error) throw new Error(`Error obteniendo solicitantes:${error.message}`);
        return data;
    }
    //Validar datos de empresa
    static validateEmpresaData(data){
        const errors=[];
        if(!data.nombre_empresa || data.nombre_empresa.trim().length<2){
            errors.push('Nombre de empresa es requerido');
        }
        if(!data.cuit || !/^\d{2}-\d{8}-\d{1}$/.test(data.cuit)) {
            errors.push('CUIT no válido fromato: 30-111111-1');
        } 
        if(!data.representante_legal || data.representante_legal.trim().length<2){
            errors.push('Representante legal es requerido');
        }
        if(!data.domicilio || data.domicilio.trim().length<5){
            errors.push('Domicilio es requerido');
        }
        return errors;
    }
}
module.exports= SolicitanteModel;