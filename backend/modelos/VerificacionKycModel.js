const {supabase}=require('../config/conexion');
class VerificacionKycModel{
    //Crear verificación KYC
    static async create(verificacionData){
        const {data, error}= await supabase
        .from('verificaciones_kyc')
        .insert([verificacionData])
        .select();
        if(error) throw new Error(`Error creando verificación KYC: ${error.message}`);
        return data[0];
    }
    //Obtener verificación por ID
    static async findById(id){
        const {data, error}=await supabase
        .from('verificaciones_kyc')
        .select('*')
        .eq('id', id)
        .single()
        if(error) throw new Error('Verificación KYC no encontrada');
        return data;

    }
    //Obtener verificaciones por solicitud
    static async findBySolicitudId(solicitudId){
        const{data, error}= await supabase
        .from('verificaciones_kyc')
        .select('*')
        .eq('solicitud_id', solicitudId)
        .order('created_at', {ascending: false});
        if(error) throw new Error(`Error obteniendo verificaciones: ${error.message}`);
        return data;

    }
    //Obtener verificación por session_id
    static async findBySessionId(sessionId){
        const{data, error}= await supabase
        .from('verificaciones_kyc')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        if(error) throw new Error(`Verificación KYC no encontrada`);
        return data;
    }
    //Actualizar verificación
    static async update(id, updates){
        const{data, error}= await supabase
        .from('verificaciones_kyc')
        .update(updates)
        .eq('id', id)
        .select();
        if(error) throw new Error(`Error actualizando verificación: ${error.message}`);
        return data[0];

    }
    //Actualizar por session_id
    static async updateBySessionId(sessionId, updates){
        const{data, error}= await supabase
        .from('verificaciones_kyc')
        .update(updates)
        .eq('session_id', sessionId)
        .select();
        if(error) throw new Error(`Error actualizando verificación: ${error.message}`);
        return data[0];
    }
    //Obtener estadísticas de verificaciones
    static async getEstadisticas(){
        const{data, error}= await supabase
        .from('verificaciones_kyc')
        .select('estado, proveedor');
        if(error) throw new Error(`Error obteniendo estadísticas:${error.message}`);
        const estadisticas={
            total:data.length,
            porEstado: {},
            porProveedor: {}
        };
        data.forEach(verificacion=>{
            estadisticas.porEstado[verificacion.estado]=(estadisticas.porEstado[verificacion.estado]||0)+1;
            estadisticas.porProveedor[verificacion.proveedor]=(estadisticas.porProveedor[verificacion.proveedor]||0)+1;
        });
        return estadisticas;
    }
}
module.exports=VerificacionKycModel;