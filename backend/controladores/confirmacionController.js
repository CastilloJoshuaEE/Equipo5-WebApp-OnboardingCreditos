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

// Confirmar email del usuario
const confirmarEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    console.log('. Procesando confirmación de email con token:', token);

    if (!token) {
      // Si es API request, responder con JSON
      if (req.headers['content-type']?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Token de confirmación no proporcionado'
        });
      }
      // Si es browser redirect, mostrar HTML
      return res.status(400).send(`
        <html><body>
          <h1>Error de Confirmación</h1>
          <p>Token no proporcionado</p>
          <a href="${FRONTEND_URL}">Volver al inicio</a>
        </body></html>
      `);
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
      return res.status(400).json({
        success: false,
        message: 'El enlace de confirmación ha expirado. Solicita uno nuevo.'
      });
    }

    // . PRIMERO: Verificar si el usuario existe en nuestra tabla
    const { data: usuarioExistente, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (usuarioError || !usuarioExistente) {
      console.error('. Usuario no encontrado en tabla usuarios:', usuarioError);
      throw new Error('Usuario no encontrado en el sistema');
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
      throw new Error('No se pudo activar la cuenta');
    }

    console.log('. Cuenta activada exitosamente en tabla usuarios para:', email);

    // . ENVIAR EMAIL DE BIENVENIDA DESPUÉS DE LA CONFIRMACIÓN
    try {
      console.log('📧 Enviando email de bienvenida después de confirmación...');
      await enviarEmailBienvenida(email, usuarioExistente.nombre_completo, usuarioExistente.rol);
      console.log('🎉 Email de bienvenida enviado exitosamente');
    } catch (emailError) {
      console.warn('. Error enviando email de bienvenida:', emailError.message);
      // No fallar la confirmación por error en email de bienvenida
    }

    // Redirigir a una página de éxito
    const mensajeExito = authConfirmed 
      ? 'Tu dirección de email ha sido confirmada correctamente en el sistema.'
      : 'Tu cuenta ha sido activada correctamente. Puedes iniciar sesión con tus credenciales.';

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Cuenta Activada - Sistema de Créditos</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: linear-gradient(135deg, #2563eb, #1d4ed8);
                  color: white;
                  height: 100vh;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
              }
              .container {
                  background: white;
                  color: #333;
                  padding: 40px;
                  border-radius: 10px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  max-width: 500px;
              }
              .success-icon {
                  font-size: 48px;
                  color: #10b981;
                  margin-bottom: 20px;
              }
              .button {
                  display: inline-block;
                  background: #2563eb;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 15px 0;
                  font-weight: bold;
              }
              .warning {
                  background: #fef3c7;
                  border-left: 4px solid #f59e0b;
                  padding: 10px;
                  margin: 15px 0;
                  border-radius: 4px;
                  color: #92400e;
                  font-size: 14px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="success-icon">.</div>
              <h1>¡Cuenta Activada Exitosamente!</h1>
              <p>${mensajeExito}</p>
              
              ${!authConfirmed ? `
              <div class="warning">
                  <p><strong>Nota:</strong> La confirmación se realizó localmente. Si tienes problemas para iniciar sesión, contacta al soporte.</p>
              </div>
              ` : ''}
              
              <p>Se ha enviado un email de bienvenida con información importante.</p>
              <p>Ahora puedes iniciar sesión en el sistema con tus credenciales.</p>
              <a href="${FRONTEND_URL}/api/login" class="button">Ir al Login</a>
          </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('. Error en confirmación de email:', error);
    if (req.headers['content-type']?.includes('application/json')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }    
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Error de Confirmación</title>
          <style>
              body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background: #fef2f2;
                  color: #dc2626;
              }
              .error-icon {
                  font-size: 48px;
                  margin-bottom: 20px;
              }
          </style>
      </head>
      <body>
          <div class="error-icon">.</div>
          <h1>Error al Activar Cuenta</h1>
          <p>${error.message || 'Ha ocurrido un error al activar tu cuenta.'}</p>
          <p>Por favor, intenta nuevamente o contacta al soporte.</p>
          <a href="${FRONTEND_URL}/api/login" style="color: #2563eb; text-decoration: none;">Volver al Inicio</a>
      </body>
      </html>
    `);
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

    console.log('. Reenviando confirmación a:', email);

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