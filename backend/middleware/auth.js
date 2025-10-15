const { supabase } = require('../config/conexion.js');
const { supabaseAdmin } = require('../config/supabaseAdmin.js'); 

const proteger = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token no proporcionado'
      });
    }

    console.log('Verificando token en middleware...');

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('Token inválido o usuario no autenticado:', error?.message);
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token inválido o expirado'
      });
    }

    // . Obtener perfil con manejo de inconsistencia
    let userProfile;
    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('. Error obteniendo perfil en middleware:', profileError);
      
      // . Intentar por email como fallback
      console.log('. Intentando obtener perfil por email en middleware...');
      const { data: fallbackProfile, error: fallbackError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', user.email)
        .single();

      if (fallbackError || !fallbackProfile) {
        console.error('. Error obteniendo perfil incluso por email en middleware:', fallbackError);
        return res.status(401).json({
          success: false,
          message: 'Error obteniendo perfil de usuario'
        });
      }

      console.log('. Perfil obtenido por email en middleware exitosamente');
      
      // . Corregir inconsistencia automáticamente
      await corregirInconsistenciaIDs(user.id, fallbackProfile.id, user.email);
      userProfile = fallbackProfile;
    } else {
      userProfile = profile;
    }

    // VERIFICACIÓN CRÍTICA: Si no existe perfil, rechazar acceso
    if (!userProfile) {
      console.error('. Perfil no encontrado para usuario');
      return res.status(401).json({
        success: false,
        message: 'Perfil de usuario no encontrado. Por favor inicie sesión nuevamente.'
      });
    }

    // Verificar si la cuenta está activa (CONFIRMACIÓN LOCAL)
    if (!userProfile.cuenta_activa) {
      console.error('. Cuenta no confirmada:', userProfile.email);
      return res.status(401).json({
        success: false,
        message: 'Por favor confirma tu email antes de acceder al sistema.'
      });
    }

    req.usuario = {
      ...user,
      ...userProfile
    };
    
    console.log('. Usuario autorizado:', userProfile.email);
    next();
  } catch (error) {
    console.error('. Error en middleware auth:', error);
    res.status(401).json({
      success: false,
      message: 'No autorizado, token falló'
    });
  }
};

// . Función de . .
const corregirInconsistenciaIDs = async (authId, tablaId, email) => {
  try {
    console.log('. [Middleware] Corrigiendo inconsistencia de IDs...');
    console.log(`   Auth ID: ${authId}`);
    console.log(`   Tabla ID: ${tablaId}`);
    console.log(`   Email: ${email}`);
    
    // Actualizar ID en tabla usuarios
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ id: authId })
      .eq('id', tablaId);

    if (updateError) {
      console.error('. Error corrigiendo ID en middleware:', updateError);
      return false;
    }

    console.log('. ID actualizado en tabla usuarios');

    // Intentar actualizar en tabla solicitantes si existe
    try {
      const { error: solicitanteError } = await supabaseAdmin
        .from('solicitantes')
        .update({ id: authId })
        .eq('id', tablaId);

      if (solicitanteError) {
        console.warn('. No se pudo actualizar tabla solicitantes:', solicitanteError.message);
      } else {
        console.log('. ID actualizado en tabla solicitantes');
      }
    } catch (solicitanteError) {
      console.warn('. Error en tabla solicitantes:', solicitanteError.message);
    }

    // Intentar actualizar en tabla operadores si existe
    try {
      const { error: operadorError } = await supabaseAdmin
        .from('operadores')
        .update({ id: authId })
        .eq('id', tablaId);

      if (operadorError) {
        console.warn('. No se pudo actualizar tabla operadores:', operadorError.message);
      } else {
        console.log('. ID actualizado en tabla operadores');
      }
    } catch (operadorError) {
      console.warn('. Error en tabla operadores:', operadorError.message);
    }

    console.log('. Inconsistencia corregida en middleware');
    return true;
  } catch (error) {
    console.error('. Error en . middleware:', error);
    return false;
  }
};

const autorizar = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.usuario.rol)) {
      console.error('. Acceso denegado para rol:', req.usuario.rol);
      return res.status(403).json({
        success: false,
        message: `Usuario rol ${req.usuario.rol} no autorizado para acceder a esta ruta`
      });
    }
    
    console.log('. Usuario autorizado para ruta:', req.usuario.rol);
    next();
  };
};

module.exports = {
  proteger,
  autorizar
};