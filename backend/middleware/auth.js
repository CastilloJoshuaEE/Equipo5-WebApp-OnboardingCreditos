// middleware/auth.js
const { supabase } = require('../config/conexion.js');

const proteger = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token no proporcionado'
      });
    }

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('❌ Token inválido:', error);
      return res.status(401).json({
        success: false,
        message: 'Token no válido'
      });
    }

    console.log('🔐 Usuario autenticado:', user.id);

    // Obtener perfil completo del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error obteniendo perfil en middleware:', profileError);
      return res.status(401).json({
        success: false,
        message: 'Error obteniendo perfil de usuario'
      });
    }

    // VERIFICACIÓN CRÍTICA: Si no existe perfil, rechazar acceso
    if (!userProfile) {
      console.error('❌ Perfil no encontrado para usuario:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Perfil de usuario no encontrado. Por favor inicie sesión nuevamente.'
      });
    }

    // Verificar si la cuenta está activa
    if (!userProfile.cuenta_activa) {
      console.error('❌ Cuenta desactivada:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada. Contacte al administrador'
      });
    }

    req.usuario = {
      ...user,
      ...userProfile
    };
    
    console.log('✅ Usuario autorizado:', userProfile.email);
    next();
  } catch (error) {
    console.error('❌ Error en middleware auth:', error);
    res.status(401).json({
      success: false,
      message: 'No autorizado, token falló'
    });
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
      console.error('❌ Acceso denegado para rol:', req.usuario.rol);
      return res.status(403).json({
        success: false,
        message: `Usuario rol ${req.usuario.rol} no autorizado para acceder a esta ruta`
      });
    }
    
    console.log('✅ Usuario autorizado para ruta:', req.usuario.rol);
    next();
  };
};

module.exports = {
  proteger,
  autorizar
};