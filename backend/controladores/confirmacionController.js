const { supabase } = require('../config/conexion.js');
const { enviarEmailConfirmacion } = require('../servicios/emailConfirmacionServicio');
const { verificarConexionBrevo } = require('../servicios/emailBrevoAPIService'); // ← CORREGIDO
const { confirmUserEmail } = require('../config/supabaseAdmin');
// Agregar función para obtener FRONTEND_URL
const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com';
  }
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

// AGREGAR ESTA FUNCIÓN FALTANTE
const enviarEmailBrevo = async (email, asunto, contenidoHTML, contenidoTexto = '') => {
  try {
    const brevoAPIService = require('../servicios/emailBrevoAPIService');
    return await brevoAPIService.enviarEmail(email, asunto, contenidoHTML, contenidoTexto);
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

// AGREGAR ESTA FUNCIÓN FALTANTE
const enviarEmailConfirmacionCuenta = async (email, nombre, userId) => {
  try {
    console.log(`. [CONFIRMACIÓN] Enviando email de confirmación a: ${email}`);
    
    const configuracionValida = await verificarConexionBrevo();
    
    if (!configuracionValida) {
      console.warn('. Configuración de Brevo no válida, no se enviará email de confirmación');
      return {
        success: false,
        error: 'Configuración de email no disponible',
        skip: true
      };
    }

    const resultado = await enviarEmailConfirmacion(email, nombre, userId);
    
    return resultado;
    
  } catch (error) {
    console.error('. Error en enviarEmailConfirmacionCuenta:', error);
    return {
      success: false,
      error: error.message,
      skip: true
    };
  }
};
const enviarEmailBienvenidaDespuesConfirmacion = async (email, nombre, rol) => {
  try {
    console.log(`. [BIENVENIDA] Enviando email de bienvenida post-confirmación a: ${email}`);
    
    // Esperar un momento para asegurar que la cuenta esté completamente activa
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const resultado = await enviarEmailBienvenida(email, nombre, rol);
    
    if (resultado.success) {
      console.log('. Email de bienvenida enviado exitosamente después de confirmación');
    } else {
      console.warn('. Email de bienvenida no enviado después de confirmación:', resultado.error);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('. Error enviando email de bienvenida post-confirmación:', error);
    // No lanzar error para no interrumpir el flujo de confirmación
    return { success: false, error: error.message };
  }
};
const confirmarEmail = async (req, res) => {
  try {
    const { token, email } = req.query;

    console.log('. [CONFIRMACIÓN] Procesando confirmación:', { token, email });

    // Validar parámetros requeridos
    if (!token || !email) {
      const frontendUrl = getFrontendUrl();
      // CORRECCIÓN: Usar URL segura en producción
      return res.redirect(`${frontendUrl}/login?error=token_o_email_faltante`);
    }

    // Decodificar y validar el token
    let decodedToken;
    try {
      decodedToken = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, userEmail, timestamp] = decodedToken.split(':');
      
      // Verificar que el email coincida
      if (userEmail !== email) {
        const frontendUrl = getFrontendUrl();
        return res.redirect(`${frontendUrl}/login?error=token_invalido`);
      }

      // Verificar expiración (24 horas)
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (currentTime - tokenTime > twentyFourHours) {
        const frontendUrl = getFrontendUrl();
        return res.redirect(`${frontendUrl}/login?error=token_expirado`);
      }

      console.log('. Token válido, activando cuenta para:', email);

      // Buscar y activar usuario (código existente)
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (usuarioError || !usuario) {
        const frontendUrl = getFrontendUrl();
        return res.redirect(`${frontendUrl}/login?error=usuario_no_encontrado`);
      }

      // Verificar si ya está confirmado
      if (usuario.cuenta_activa) {
        const frontendUrl = getFrontendUrl();
        return res.redirect(`${frontendUrl}/login?message=cuenta_ya_confirmada`);
      }
      
      // Activar la cuenta
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          cuenta_activa: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (updateError) {
        throw updateError;
      }

      console.log('. Cuenta activada exitosamente en tabla local para:', email);

      // Confirmar en Supabase Auth
      const confirmResult = await confirmUserEmail(usuario.id);

      if (confirmResult.success) {
        console.log('. Email confirmado exitosamente en Supabase Auth para:', email);
      } else {
        console.warn('. No se pudo confirmar email en Supabase Auth, pero cuenta local está activa:', confirmResult.error);
      }

      // Enviar email de bienvenida
      await enviarEmailBienvenidaDespuesConfirmacion(
        usuario.email, 
        usuario.nombre_completo, 
        usuario.rol
      );

      console.log('. Cuenta activada exitosamente para:', email);

      // CORRECCIÓN CRÍTICA: Redirigir siempre al frontend seguro
      const frontendUrl = getFrontendUrl();
      return res.redirect(`${frontendUrl}/login?message=email_confirmado`);

    } catch (decodeError) {
      console.error('. Error decodificando token:', decodeError);
      const frontendUrl = getFrontendUrl();
      return res.redirect(`${frontendUrl}/login?error=token_invalido`);
    }

  } catch (error) {
    console.error('. Error en confirmarEmail:', error);
    
    // CORRECCIÓN: Redirigir siempre al frontend
    const frontendUrl = getFrontendUrl();
    return res.redirect(`${frontendUrl}/login?error=confirmacion_fallida`);
  }
};

const reenviarConfirmacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    console.log('. [CONFIRMACIÓN] Reenviando confirmación a:', email);

    // Buscar usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (usuarioError || !usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si ya está confirmado
    if (usuario.cuenta_activa) {
      return res.status(400).json({
        success: false,
        message: 'La cuenta ya está confirmada'
      });
    }

    // Reenviar email de confirmación
    const emailResult = await enviarEmailConfirmacionCuenta(
      usuario.email, 
      usuario.nombre_completo, 
      usuario.id
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error enviando email de confirmación'
      });
    }

    res.json({
      success: true,
      message: 'Email de confirmación reenviado exitosamente'
    });

  } catch (error) {
    console.error('. Error en reenviarConfirmacion:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const estadoConfirmacionEmail = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('cuenta_activa')
      .eq('id', usuarioId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        email_confirmado: usuario.cuenta_activa
      }
    });

  } catch (error) {
    console.error('. Error en estadoConfirmacionEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando estado de confirmación'
    });
  }
};
const enviarEmailBienvenida = async (email, nombre, rol) => {
  try {
    console.log(`. [BREVO] Intentando enviar email de bienvenida a: ${email}`);
    
    const configuracionValida = await verificarConexionBrevo();
    
    if (!configuracionValida) {
      console.warn('. Configuración de Brevo no válida, no se enviará email');
      return {
        success: false,
        error: 'Configuración de email no disponible',
        skip: true
      };
    }

    const plantilla = crearPlantillaBienvenida(nombre, rol);
    const resultado = await enviarEmailBrevo(email, plantilla.asunto, plantilla.html, plantilla.texto);
    
    if (resultado.success) {
      console.log('. . Email de bienvenida enviado exitosamente via Brevo');
    } else {
      console.warn('. . Email de bienvenida no enviado:', resultado.error);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('. . Error en servicio de email de bienvenida:', error);
    return {
      success: false,
      error: error.message,
      skip: true
    };
  }
};
const crearPlantillaBienvenida = (nombre, rol) => {
  const asunto = rol === 'operador' 
    ? '¡Bienvenido Operador al Sistema de Créditos!' 
    : '¡Bienvenido Solicitante al Sistema de Créditos!';
  
  const mensaje = rol === 'operador'
    ? `Hola <strong>${nombre}</strong>, bienvenido como operador del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a gestionar solicitudes.`
    : `Hola <strong>${nombre}</strong>, bienvenido como solicitante del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a solicitar créditos para tu empresa.`;

  const frontendUrl = getFrontendUrl();

  return {
    asunto,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .content { 
            padding: 30px; 
            background: #f9fafb; 
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${asunto}</h1>
        </div>
        <div class="content">
            <p>Estimado/a <strong>${nombre}</strong>,</p>
            <p>${mensaje}</p>
            
            <p style="text-align: center;">
              <a href="${frontendUrl}/login" class="button">Iniciar Sesión en el Sistema</a>
            </p>
        </div>
    </div>
</body>
</html>
    `,
    texto: `${asunto}

Hola ${nombre},

${mensaje}

Puedes iniciar sesión en: ${frontendUrl}/login

Sistema de Créditos`
  };
};

module.exports = {
  confirmarEmail,
  reenviarConfirmacion,
  estadoConfirmacionEmail,
  enviarEmailBienvenida,
  enviarEmailConfirmacionCuenta,
  verificarServicioEmail: verificarConexionBrevo
};