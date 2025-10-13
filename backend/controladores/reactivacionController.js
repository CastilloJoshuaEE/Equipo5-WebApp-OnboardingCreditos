const { supabase } = require('../config/conexion.js');
const { supabaseAdmin } = require('../config/supabaseAdmin.js');
const { enviarEmailRecuperacionCuenta } = require('../servicios/emailRecuperacionServicio');
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
const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com';
  }
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};
const procesarRecuperacionCuenta = async (req, res) => {
  try {
    const { token, email } = req.query;

    console.log('. [RECUPERACIÓN] Procesando recuperación de cuenta:', { token, email });

    // Validar parámetros requeridos
    if (!token || !email) {
      const frontendUrl = getFrontendUrl();
      return res.redirect(`${frontendUrl}/login?error=token_o_email_faltante`);
    }

    // Decodificar y validar el token
    let decodedToken;
    try {
      decodedToken = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, userEmail, timestamp, tipo] = decodedToken.split(':');
      
      // Verificar que el email coincida
      if (userEmail !== email) {
        const frontendUrl = getFrontendUrl();
        return res.redirect(`${frontendUrl}/login?error=token_invalido`);
      }

      // Verificar expiración (1 hora)
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (currentTime - tokenTime > oneHour) {
        const frontendUrl = getFrontendUrl();
        return res.redirect(`${frontendUrl}/login?error=token_expirado`);
      }

      console.log('. Token válido, buscando usuario:', email);

      // Buscar usuario inactivo
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();
      if (usuario.cuenta_activa) {
        console.log('. Usuario ya está activo:', email);
        const frontendUrl = getFrontendUrl();
        return res.redirect(`${frontendUrl}/login?message=cuenta_ya_activa`);
      }
      if (usuarioError || !usuario) {
        const frontendUrl = getFrontendUrl();
        return res.redirect(`${frontendUrl}/login?error=usuario_no_encontrado`);
      }

      console.log('. Usuario inactivo encontrado, reactivando cuenta...');

      // Reactivar la cuenta
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          cuenta_activa: true,
          fecha_desactivacion: null,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (updateError) {
        throw updateError;
      }

      console.log('. Cuenta reactivada exitosamente para:', email);

      // Redirigir al frontend con mensaje de éxito
      const frontendUrl = getFrontendUrl();
      return res.redirect(`${frontendUrl}/login?message=cuenta_reactivada`);

    } catch (decodeError) {
      console.error('. Error decodificando token:', decodeError);
      const frontendUrl = getFrontendUrl();
      return res.redirect(`${frontendUrl}/login?error=token_invalido`);
    }

  } catch (error) {
    console.error('. Error en procesarRecuperacionCuenta:', error);
    const frontendUrl = getFrontendUrl();
    return res.redirect(`${frontendUrl}/login?error=recuperacion_fallida`);
  }
};

module.exports = {
  solicitarReactivacionCuenta,
  procesarRecuperacionCuenta,
  reactivarCuenta
};