//backend/infrastructure/database/conexion.js
const { supabaseClient } = require("./supabaseClient");

// Verificar conexión
const verificarConexion = async () => {
  try {
    const { data, error } = await supabaseClient.from('usuarios').select('count').limit(1);
    
    if (error) {
      // Si la tabla no existe, es normal al principio
      if (error.code === '42P01') {
        return true;
      }
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('. Error conectando a Supabase:', error.message);
    return false;
  }
};
const verificarStorage = async () => {
  try {
    
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