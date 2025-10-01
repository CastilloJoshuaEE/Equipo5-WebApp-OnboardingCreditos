const { supabase } = require('../config/conexion.js');
const { supabaseAdmin } = require('../config/supabaseAdmin.js');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Intentando login para:', email);

    // Validar campos obligatorios
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // 1. PRIMERO verificar si existe en nuestra tabla usuarios
    console.log('📋 Verificando existencia en tabla usuarios...');
    const { data: usuarioExistente, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, email, cuenta_activa, rol')
      .eq('email', email)
      .maybeSingle();

    if (usuarioError) {
      console.error('❌ Error verificando usuario:', usuarioError);
      throw usuarioError;
    }

    // Si no existe en nuestra tabla, rechazar login inmediatamente
    if (!usuarioExistente) {
      console.log('❌ Usuario no encontrado en tabla usuarios');
      return res.status(401).json({
        success: false,
        message: 'No hay una cuenta registrada con este email. Por favor regístrese primero.'
      });
    }

    // 2. Verificar si la cuenta está activa
    if (!usuarioExistente.cuenta_activa) {
      console.log('❌ Cuenta desactivada encontrada');
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada. Contacte al administrador.'
      });
    }

    console.log('✅ Usuario válido encontrado en tabla usuarios, procediendo con autenticación...');

    // 3. Autenticar con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Error en Supabase Auth:', authError);
      
      let errorMessage = 'Credenciales inválidas';
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (authError.message.includes('Email not confirmed')) {
        errorMessage = 'Email no confirmado';
      }
      
      return res.status(401).json({
        success: false,
        message: errorMessage
      });
    }

    console.log('✅ Login exitoso en Auth, ID:', authData.user.id);

    // 4. Verificar consistencia entre Auth ID y nuestro ID de usuario
    if (authData.user.id !== usuarioExistente.id) {
      console.warn('⚠️ Inconsistencia de IDs:', {
        authId: authData.user.id,
        nuestraId: usuarioExistente.id
      });
      
      // Actualizar nuestro ID al de Auth para mantener consistencia
      const { error: updateError } = await supabaseAdmin
        .from('usuarios')
        .update({ id: authData.user.id })
        .eq('id', usuarioExistente.id);

      if (updateError) {
        console.error('❌ Error actualizando ID:', updateError);
        // Continuar pero marcar advertencia
      } else {
        console.log('✅ ID actualizado para mantener consistencia');
      }
    }

    // 5. Obtener perfil completo del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error obteniendo perfil completo:', profileError);
      throw profileError;
    }

    console.log('✅ Login completado exitosamente');

    // 6. Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        session: authData.session,
        user: authData.user,
        profile: userProfile
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor durante el login posible causa credenciales incorrectas'
    });
  }
};

const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;

    res.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getSession = async (req, res) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'No hay sesión activa'
      });
    }

    console.log('🔍 Verificando sesión para usuario:', session.user.id);

    // Obtener perfil del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error obteniendo perfil en getSession:', profileError);
      throw profileError;
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de usuario no encontrado. Por favor inicie sesión nuevamente.'
      });
    }

    if (!userProfile.cuenta_activa) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    res.json({
      success: true,
      data: {
        session,
        user: session.user,
        profile: userProfile
      }
    });
  } catch (error) {
    console.error('❌ Error en getSession:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  getSession
};