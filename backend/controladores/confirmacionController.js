const { supabaseAdmin } = require('../config/supabaseAdmin.js');
const { enviarEmailBienvenida } = require('../servicios/emailServicio');

// URLs según entorno
const FRONTEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com'
  : 'http://localhost:3000';

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

const confirmarEmail = async (req, res) => {
  try {
    const { token } = req.query;
    
    console.log('. Procesando confirmación de email con token:', token);

    if (!token) {
      return res.status(400).send(`
        <html><body>
          <h1>Error de Confirmación</h1>
          <p>Token no proporcionado</p>
          <a href="${FRONTEND_URL}">Volver al inicio</a>
        </body></html>
      `);
    }

    // DECODIFICAR EL TOKEN CORRECTAMENTE
    let tokenDecodificado;
    try {
      tokenDecodificado = Buffer.from(token, 'base64').toString('utf-8');
    } catch (decodeError) {
      console.error('. Error decodificando token:', decodeError);
      return res.status(400).send(`
        <html><body>
          <h1>Token Inválido</h1>
          <p>El token de confirmación no es válido.</p>
          <a href="${FRONTEND_URL}">Volver al inicio</a>
        </body></html>
      `);
    }

    const parts = tokenDecodificado.split(':');
    if (parts.length < 3) {
      console.error('. Formato de token inválido:', tokenDecodificado);
      return res.status(400).send(`
        <html><body>
          <h1>Token Inválido</h1>
          <p>El formato del token es incorrecto.</p>
          <a href="${FRONTEND_URL}">Volver al inicio</a>
        </body></html>
      `);
    }

    const [userId, email, timestamp] = parts;
    
    console.log('. Confirmando email para usuario:', { userId, email });

    // VERIFICAR EXPIRACIÓN (24 HORAS)
    const tiempoToken = parseInt(timestamp);
    const ahora = Date.now();
    const diferenciaHoras = (ahora - tiempoToken) / (1000 * 60 * 60);
    
    if (diferenciaHoras > 24) {
      console.log('. Token expirado:', diferenciaHoras.toFixed(2), 'horas');
      return res.status(400).send(`
        <html><body>
          <h1>Enlace Expirado</h1>
          <p>El enlace de confirmación ha expirado. Solicita uno nuevo desde tu cuenta.</p>
          <a href="${FRONTEND_URL}/login">Ir al Login</a>
        </body></html>
      `);
    }

    // BUSCAR USUARIO EN NUESTRA TABLA
    const { data: usuarioExistente, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (usuarioError || !usuarioExistente) {
      console.error('. Usuario no encontrado en tabla usuarios:', { userId, error: usuarioError });
      
      // INTENTAR BUSCAR POR EMAIL COMO FALLBACK
      console.log('. Intentando buscar usuario por email...');
      const { data: usuarioPorEmail, error: emailError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (emailError || !usuarioPorEmail) {
        console.error('. Usuario no encontrado ni por ID ni por email');
        throw new Error('Usuario no encontrado en el sistema');
      }

      console.log('. Usuario encontrado por email, procediendo con confirmación...');
      // USAR EL USUARIO ENCONTRADO POR EMAIL
      usuarioExistente = usuarioPorEmail;
    }

    console.log('. Usuario encontrado:', usuarioExistente.email);

    // ACTUALIZAR CUENTA COMO ACTIVA
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ 
        cuenta_activa: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', usuarioExistente.id);

    if (updateError) {
      console.error('. Error actualizando usuario:', updateError);
      throw new Error('No se pudo activar la cuenta');
    }

    console.log('. Cuenta activada exitosamente para:', email);

    // ENVIAR EMAIL DE BIENVENIDA
    try {
      console.log('. Enviando email de bienvenida...');
      await enviarEmailBienvenida(email, usuarioExistente.nombre_completo, usuarioExistente.rol);
    } catch (emailError) {
      console.warn('. Error enviando email de bienvenida:', emailError.message);
    }

    // REDIRIGIR A PÁGINA DE ÉXITO
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
                  background: linear-gradient(135deg, #10b981, #059669);
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
                  background: #10b981;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 15px 0;
                  font-weight: bold;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="success-icon">✅</div>
              <h1>¡Cuenta Activada Exitosamente!</h1>
              <p>Tu dirección de email ha sido confirmada correctamente.</p>
              <p>Ahora puedes iniciar sesión en el sistema con tus credenciales.</p>
              <a href="${FRONTEND_URL}/login" class="button">Ir al Login</a>
          </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('. Error en confirmación de email:', error);
    res.status(400).send(`
      <html>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #dc2626;">Error al Activar Cuenta</h1>
          <p>${error.message || 'Ha ocurrido un error al activar tu cuenta.'}</p>
          <p>Por favor, intenta nuevamente o contacta al soporte.</p>
          <a href="${FRONTEND_URL}" style="color: #2563eb; text-decoration: none;">Volver al Inicio</a>
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