const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('. SUPABASE_SERVICE_ROLE_KEY no configurada en .env');
  process.exit(1);
}

// Cliente admin con service_role key (SOLO para uso en servidor)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Función para obtener usuario por email
const getUserByEmail = async (email) => {
  try {
    // Usar listUsers y filtrar por email
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    const user = users.find(u => u.email === email);
    return { data: { user }, error: user ? null : new Error('Usuario no encontrado') };
  } catch (error) {
    return { data: { user: null }, error };
  }
};
const confirmUserEmail = async (userId) => {
  try {
    console.log(`. Confirmando email en Auth para usuario: ${userId}`);
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );

    if (error) {
      console.error('. Error confirmando email en Auth:', error);
      return { success: false, error };
    }

    console.log('. Email confirmado exitosamente en Supabase Auth');
    return { success: true, data };
  } catch (error) {
    console.error('. Error en confirmUserEmail:', error);
    return { success: false, error };
  }
};

module.exports = { 
  supabaseAdmin,
  getUserByEmail,
  confirmUserEmail
}; 
