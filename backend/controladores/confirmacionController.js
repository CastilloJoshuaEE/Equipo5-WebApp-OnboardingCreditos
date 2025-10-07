const { supabaseAdmin } = require('../config/supabaseAdmin.js');
const { enviarEmailBienvenida } = require('../servicios/emailServicio');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Verificar estado de confirmación de email
const estadoConfirmacionEmail = async (req, res) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(req.usuario.id);
    
    if (error) throw error;

    res.json({
      success: true,
      data: {
        emailConfirmed: !!user.email_confirmed_at,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Confirmar email del usuario - VERSIÓN MEJORADA
const confirmarEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    console.log(' Procesando confirmación de email con token:', token);

    if (!token) {
      // Si es una API call, responder con JSON
      if (req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Token de confirmación no proporcionado'
        });
      }
      // Si es un navegador, redirigir con error
      return res.redirect(`${FRONTEND_URL}/auth/error?message=Token no proporcionado`);
    }

    // Decodificar el token
    const tokenDecodificado = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, email, timestamp] = tokenDecodificado.split(':');
    
    console.log('📧 Confirmando email para usuario:', { userId, email });

    // Verificar que el token no sea muy viejo (24 horas máximo)
    const tiempoToken = parseInt(timestamp);
    const ahora = Date.now();
    const diferenciaHoras = (ahora - tiempoToken) / (1000 * 60 * 60);
    
    if (diferenciaHoras > 24) {
      const errorMessage = 'El enlace de confirmación ha expirado. Solicita uno nuevo.';
      
      // Respuesta JSON para API calls
      if (req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: errorMessage
        });
      }
      
      // Redirección para navegador
      return res.redirect(`${FRONTEND_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`);
    }

    // . PRIMERO: Verificar si el usuario existe en nuestra tabla
    const { data: usuarioExistente, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (usuarioError || !usuarioExistente) {
      console.error('. Usuario no encontrado en tabla usuarios:', usuarioError);
      const errorMessage = 'Usuario no encontrado en el sistema';
      
      if (req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
        throw new Error(errorMessage);
      }
      
      return res.redirect(`${FRONTEND_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`);
    }

    console.log('. Usuario encontrado en tabla usuarios:', usuarioExistente.email);

    let authConfirmed = false;

    // . INTENTAR CONFIRMAR EN SUPABASE AUTH (pero continuar si falla)
    try {
      const { data: user, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );

      if (confirmError) {
        console.warn('. No se pudo confirmar en Auth (puede que el usuario no exista en Auth):', confirmError.message);
        // Continuar con el proceso aunque falle en Auth
      } else {
        console.log('. Email confirmado exitosamente en Supabase Auth');
        authConfirmed = true;
      }
    } catch (authError) {
      console.warn('. Error en confirmación de Auth, continuando con confirmación local:', authError.message);
    }

    // . ACTUALIZAR CUENTA COMO ACTIVA en nuestra tabla (ESTO ES LO MÁS IMPORTANTE)
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ 
        cuenta_activa: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('. Error actualizando usuario:', updateError);
      const errorMessage = 'No se pudo activar la cuenta';
      
      if (req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
        throw new Error(errorMessage);
      }
      
      return res.redirect(`${FRONTEND_URL}/auth/error?message=${encodeURIComponent(errorMessage)}`);
    }

    console.log('. Cuenta activada exitosamente en tabla usuarios para:', email);

    // . ENVIAR EMAIL DE BIENVENIDA DESPUÉS DE LA CONFIRMACIÓN
    try {
      console.log(' Enviando email de bienvenida después de confirmación...');
      await enviarEmailBienvenida(email, usuarioExistente.nombre_completo, usuarioExistente.rol);
      console.log(' Email de bienvenida enviado exitosamente');
    } catch (emailError) {
      console.warn('. Error enviando email de bienvenida:', emailError.message);
      // No fallar la confirmación por error en email de bienvenida
    }

    // DETERMINAR TIPO DE RESPUESTA
    const mensajeExito = authConfirmed 
      ? 'Tu dirección de email ha sido confirmada correctamente en el sistema.'
      : 'Tu cuenta ha sido activada correctamente. Puedes iniciar sesión con tus credenciales.';

    // Si es una llamada API (desde el frontend), responder con JSON
    if (req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
      return res.json({
        success: true,
        message: mensajeExito,
        data: {
          userId: userId,
          email: email,
          authConfirmed: authConfirmed
        }
      });
    }

    // Si es un navegador directo, redirigir a página de éxito
    return res.redirect(`${FRONTEND_URL}/confirmacion?success=true&message=${encodeURIComponent(mensajeExito)}`);

  } catch (error) {
    console.error('. Error en confirmación de email:', error);
    
    // Manejar error según el tipo de request
    if (req.headers['content-type']?.includes('application/json') || req.headers['accept']?.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Ha ocurrido un error al activar tu cuenta.'
      });
    }
    
    // Redirección para navegador
    res.redirect(`${FRONTEND_URL}/auth/error?message=${encodeURIComponent(error.message || 'Ha ocurrido un error al activar tu cuenta.')}`);
  }
};

// Reenviar email de confirmación
const reenviarConfirmacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    console.log(' Reenviando confirmación a:', email);

    // Buscar usuario
    const { data: usuario, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre_completo, email, cuenta_activa')
      .eq('email', email)
      .single();

    if (error || !usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si ya está activo
    if (usuario.cuenta_activa) {
      return res.status(400).json({
        success: false,
        message: 'La cuenta ya está activa. Puedes iniciar sesión.'
      });
    }

    // Enviar nuevo email de confirmación
    const { enviarEmailConfirmacionCuenta } = require('../servicios/emailServicio');
    const resultado = await enviarEmailConfirmacionCuenta(
      usuario.email, 
      usuario.nombre_completo, 
      usuario.id
    );

    if (resultado.success) {
      res.json({
        success: true,
        message: 'Email de confirmación reenviado exitosamente'
      });
    } else {
      throw new Error(resultado.error);
    }

  } catch (error) {
    console.error('. Error reenviando confirmación:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  estadoConfirmacionEmail,
  confirmarEmail,
  reenviarConfirmacion
};