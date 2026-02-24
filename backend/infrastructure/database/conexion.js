//backend/infrastructure/database/conexion.js
const { supabaseClient } = require("./supabaseClient");

// Verificar conexión
const verificarConexion = async () => {
  try {
    const { data, error } = await supabaseClient.from('usuarios').select('count').limit(1);
    
    if (error) {
      // Si la tabla no existe, es normal al principio
      if (error.code === '42P01') {
        console.log('.  La tabla usuarios no existe aún. Se creará con los datos iniciales.');
        return true;
      }
      throw error;
    }
    
    console.log('. Conexión a Supabase establecida correctamente');
    return true;
  } catch (error) {
    console.error('. Error conectando a Supabase:', error.message);
    return false;
  }
};
const verificarStorage = async () => {
  try {
    console.log('. Verificando acceso a Storage...');
    
    // Intentar una operación simple de listado
    const { data, error } = await supabaseClient.storage
      .from('kyc-documents')
      .list('', {
        limit: 1,
        offset: 0
      });
    
    if (error) {
      if (error.message.includes('Bucket not found')) {
        console.error('. El bucket kyc-documents no existe');
        return false;
      }
      console.warn('. No se puede listar buckets (puede ser normal):', error.message);
      // Continuar aunque falle el listado, el bucket puede existir
    }
    
    console.log('. Storage verificado - listado:', data ? 'funciona' : 'no disponible');
    return true;
    
  } catch (error) {
    console.error('. Error verificando storage:', error.message);
    return false;
  }
};
module.exports = {
  verificarConexion,
  verificarStorage
};