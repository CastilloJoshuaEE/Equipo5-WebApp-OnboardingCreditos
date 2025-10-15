const {supabase}=require('../config/conexion');
class DocumentoModel{
    //Crear documento
    static async create(documentoData){
        const{data, error}=await supabase
        .from('documentos')
        .insert([documentoData])
        .select();
        if(error) throw new Error(`Error creando documento: ${error.message}`);
        return data[0];
    }
    //Obtener documento por ID
    static async finById(id){
        const {data, error}= await supabase
        .from('documentos')
        .select('*')
        .eq('id', id)
        .single();
        if(error) throw new Error('Documento no encontrado');
        return data;
    }
    //Obtener documentos por solicitud
    static async findBySolicitudId(solicitudId){
        const{data, error}= await supabase
        .from('documentos')
        .select('*')
        .eq('solicitud_id', solicitudId)
        .order('created_at', {ascending: false});
        if(error) throw new Error(`Error obteniendo documentos: ${error.message}`);
        return data;
    }
    //Actualizar documento
    static async update(id, updates){
        const{data, error}=await supabase
        .from('documentos')
        .update(updates)
        .eq('id', id)
        .select();
        if(error) throw new Error(`Error actualizando documento:${error.message}`);
        return data[0];

    }
    //Eliminar documento
    static async delete(id){
        const {error}= await supabase
        .from('documentos')
        .delete()
        .eq('id', id);
        if(error) throw new Error(`Error eliminando documento:${error.message}`);
        return true;
    }
    //Contar documentos por tipo y estado
    static async countByTipoAndEstado(solicitudId, tipo, estado){
        const{count, error}= await supabase
        .from('documentos')
        .select('*', {count:'exact', head:true})
        .eq('solicitud_id', solicitudId)
        .eq('tipo', tipo)
        .eq('estado', estado);
        if(error) throw new Error(`Error contando documentos:${error.message}`);
        return count;
    }
    //Verificar documentos obligatorios completos
    static async verificarDocumentosObligatorios(solicitudId){
        const tiposObligatorios=['dni', 'cuit', 'comprobante_domicilio'];
        const{data, error}= await supabase
        .from('documentos')
        .select('tipo')
        .eq('solicitud_id', solicitudId)
        .in('tipo', tiposObligatorios)
        if(error) throw new Error(`Error verificando documentos: ${error.message}`);
        const tiposSubidos=data.map(docs=>docs.tipo);
        const documentosFaltantes= tiposObligatorios.filter(tipo=>!tiposSubidos.includes(tipo));
        return{
            completos: documentosFaltantes.length===0,
            documentosFaltantes,
            documentosSubidos: tiposSubidos
        };
    }
}
module.exports=DocumentoModel;