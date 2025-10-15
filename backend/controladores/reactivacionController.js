const { supabase } = require('../config/conexion.js');
const { supabaseAdmin } = require('../config/supabaseAdmin.js');
const { enviarEmailRecuperacionCuenta } = require('../servicios/emailRecuperacionServicio');

/**
 * @typedef {Object} ReactivacionRequest
 * @property {string} email
 */

/**
 * @typedef {Object} ReactivacionResponse
 * @property {boolean} success
 * @property {string} message
 */

/**
 * Solicita la reactivación de cuenta
 * @param {import('express').Request<{}, {}, ReactivacionRequest>} req
 * @param {import('express').Response<ReactivacionResponse>} res
 */
const solicitarReactivacionCuenta = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    console.log('. Solicitando reactivación para:', email);

    // Buscar usuario inactivo
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('cuenta_activa', false)
      .single();

    if (usuarioError || !usuario) {
      // Por seguridad, no revelar si existe o no
      console.log('. Usuario inactivo no encontrado:', email);
      return res.json({
        success: true,
        message: 'Si el email está registrado y la cuenta está inactiva, recibirás un enlace de reactivación.'
      });
    }

    console.log('. Usuario inactivo encontrado:', usuario.nombre_completo);

    // Enviar email de reactivación
    try {
      const emailResult = await enviarEmailRecuperacionCuenta(
        usuario.email, 
        usuario.nombre_completo, 
        usuario.id
      );

      if (emailResult.success) {
        console.log('. Email de reactivación enviado exitosamente');
        return res.json({
          success: true,
          message: 'Se ha enviado un enlace de reactivación a tu email. Por favor revisa tu bandeja de entrada.'
        });
      } else {
        throw new Error('Error enviando email de reactivación');
      }
    } catch (emailError) {
      console.error('. Error enviando email de reactivación:', emailError);
      
      // En desarrollo, permitir reactivación directa
      if (process.env.NODE_ENV === 'development') {
        console.log('. Modo desarrollo: Reactivando cuenta directamente...');
        
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({
            cuenta_activa: true,
            fecha_desactivacion: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', usuario.id);

        if (updateError) throw updateError;

        return res.json({
          success: true,
          message: 'Cuenta reactivada exitosamente (modo desarrollo). Ya puedes iniciar sesión.',
          desarrollo: true
        });
      }

      throw new Error('No se pudo enviar el email de reactivación');
    }

  } catch (error) {
    console.error('. Error en solicitarReactivacionCuenta:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al solicitar reactivación de cuenta'
    });
  }
};

/**
 * Reactiva cuenta con email y password
 * @param {import('express').Request<{}, {}, {email: string, password: string}>} req
 * @param {import('express').Response} res
 */
const reactivarCuenta = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    console.log('. Intentando reactivar cuenta para:', email);

    // Buscar usuario inactivo
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('cuenta_activa', false)
      .single();

    if (usuarioError || !usuario) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una cuenta desactivada con este email'
      });
    }

    // Verificar credenciales con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Reactivar la cuenta
    const { data: usuarioReactivated, error: updateError } = await supabase
      .from('usuarios')
      .update({
        cuenta_activa: true,
        fecha_desactivacion: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', usuario.id)
      .select();

    if (updateError) {
      throw updateError;
    }

    console.log('. Cuenta reactivada exitosamente para:', email);

    res.json({
      success: true,
      message: 'Cuenta reactivada exitosamente. ¡Bienvenido de nuevo!',
      data: {
        user: authData.user,
        profile: usuarioReactivated[0]
      }
    });

  } catch (error) {
    console.error('. Error en reactivarCuenta:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al reactivar la cuenta'
    });
  }
};

/**
 * Obtiene la URL del frontend
 * @returns {string}
 */
const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com';
  }
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};
/**
 * Procesa la recuperación de cuenta via token (versión JSON para frontend)
 * @param {import('express').Request<{}, {}, {}, {token: string, email: string}>} req
 * @param {import('express').Response} res
 */
const procesarRecuperacionCuenta = async (req, res) => {
  try {
    const { token, email } = req.query;

    console.log('. [RECUPERACIÓN] Procesando recuperación de cuenta (JSON):', { 
      token: token ? `${token.substring(0, 20)}...` : 'undefined',
      email 
    });

    // Validar parámetros requeridos
    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Token o email faltante'
      });
    }

    // Decodificar y validar el token
    let decodedToken;
    try {
      // Decodificar el token base64
      decodedToken = Buffer.from(token, 'base64').toString('utf-8');
      console.log('. Token decodificado:', decodedToken);
      
      const parts = decodedToken.split(':');
      console.log('. Partes del token:', parts);
      
      // Validar que tenga las partes esperadas
      if (parts.length < 3) {
        throw new Error('Formato de token inválido');
      }

      const [userId, userEmail, timestamp, tipo] = parts;
      
      // Verificar que el email coincida
      if (userEmail !== email) {
        console.error('. Email no coincide:', { userEmail, email });
        return res.status(400).json({
          success: false,
          message: 'Token inválido'
        });
      }

      // Verificar expiración (1 hora)
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (currentTime - tokenTime > oneHour) {
        console.error('. Token expirado:', { tokenTime, currentTime });
        return res.status(400).json({
          success: false,
          message: 'Token expirado'
        });
      }

      console.log('. Token válido, buscando usuario:', email);

      // Buscar usuario (activo o inactivo)
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (usuarioError || !usuario) {
        console.error('. Usuario no encontrado:', email);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // VERIFICACIÓN CRÍTICA: Comprobar si hay inconsistencia de IDs
      if (usuario.id !== userId) {
        console.warn('. INCONSISTENCIA DE ID DETECTADA:', {
          tokenUserId: userId,
          tablaUserId: usuario.id,
          email: email
        });
        
        // CORREGIR LA INCONSISTENCIA: Actualizar el ID en la tabla
        console.log('. Corrigiendo inconsistencia de ID...');
        const { error: updateError } = await supabaseAdmin
          .from('usuarios')
          .update({ id: userId })
          .eq('email', email);

        if (updateError) {
          console.error('. Error corrigiendo ID:', updateError);
          // Continuar con el proceso usando el ID del token
        } else {
          console.log('. ID corregido exitosamente');
        }
      }

      // Si la cuenta YA está activa, informar al usuario
      if (usuario.cuenta_activa) {
        console.log('. Usuario ya está activo:', email);
        return res.json({
          success: true,
          message: 'Cuenta ya activa',
          cuenta_activa: true
        });
      }

      console.log('. Usuario inactivo encontrado, reactivando cuenta...');

      // Reactivar la cuenta usando el ID del token (que es el correcto)
      const { error: updateError } = await supabaseAdmin
        .from('usuarios')
        .update({
          cuenta_activa: true,
          fecha_desactivacion: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId); // Usar el ID del token que es el correcto

      if (updateError) {
        console.error('. Error reactivando cuenta:', updateError);
        
        // Intentar con el email como fallback
        console.log('. Intentando reactivación por email...');
        const { error: fallbackError } = await supabaseAdmin
          .from('usuarios')
          .update({
            cuenta_activa: true,
            fecha_desactivacion: null,
            updated_at: new Date().toISOString()
          })
          .eq('email', email);

        if (fallbackError) {
          throw fallbackError;
        }
      }

      console.log('. Cuenta reactivada exitosamente para:', email);

      return res.json({
        success: true,
        message: 'Cuenta reactivada exitosamente',
        cuenta_reactivada: true,
        email: email
      });

    } catch (decodeError) {
      console.error('. Error decodificando token:', decodeError);
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

  } catch (error) {
    console.error('. Error en procesarRecuperacionCuenta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
module.exports = {
  solicitarReactivacionCuenta,
  procesarRecuperacionCuenta,
  reactivarCuenta
};