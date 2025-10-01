const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL o SUPABASE_ANON_KEY no están configuradas en las variables de entorno');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Verificar conexión
const verificarConexion = async () => {
  try {
    const { data, error } = await supabase.from('usuarios').select('count').limit(1);
    
    if (error) {
      // Si la tabla no existe, es normal al principio
      if (error.code === '42P01') {
        console.log('⚠️  La tabla usuarios no existe aún. Se creará con los datos iniciales.');
        return true;
      }
      throw error;
    }
    
    console.log('✅ Conexión a Supabase establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  verificarConexion
};