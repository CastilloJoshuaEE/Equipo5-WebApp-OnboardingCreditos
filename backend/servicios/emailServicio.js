const { 
  enviarEmailBienvenidaGmail, 
  verificarConexionGmail,
  enviarEmailGmail 
} = require('./emailGmailServicio');

const { 
  enviarEmailConfirmacion 
} = require('./emailConfirmacionServicio');

// Función principal .
const enviarEmailBienvenida = async (email, nombre, rol) => {
  try {
    console.log(`📧 [GMAIL] Intentando enviar email de bienvenida a: ${email}`);
    
    // Verificar configuración de Gmail
    const configuracionValida = await verificarConexionGmail();
    
    if (!configuracionValida) {
      console.warn('. Configuración de Gmail no válida, no se enviará email');
      return {
        success: false,
        error: 'Configuración de email no disponible',
        skip: true
      };
    }

    // Enviar email usando Gmail
    const resultado = await enviarEmailBienvenidaGmail(email, nombre, rol);
    
    if (resultado.success) {
      console.log('🎉 Email de bienvenida enviado exitosamente via Gmail');
    } else {
      console.warn('. Email no enviado, pero usuario creado:', resultado.error);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('. Error en servicio de email:', error);
    return {
      success: false,
      error: error.message,
      skip: true
    };
  }
};

// . NUEVA FUNCIÓN: Enviar email de confirmación
const enviarEmailConfirmacionCuenta = async (email, nombre, userId) => {
  try {
    console.log(`📧 [CONFIRMACIÓN] Enviando email de confirmación a: ${email}`);
    
    const configuracionValida = await verificarConexionGmail();
    
    if (!configuracionValida) {
      console.warn('. Configuración de Gmail no válida, no se enviará email de confirmación');
      return {
        success: false,
        error: 'Configuración de email no disponible',
        skip: true
      };
    }

    const resultado = await enviarEmailConfirmacion(email, nombre, userId);
    
    if (resultado.success) {
      console.log('🎉 Email de confirmación enviado exitosamente');
    } else {
      console.warn('. Email de confirmación no enviado:', resultado.error);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('. Error en servicio de confirmación:', error);
    return {
      success: false,
      error: error.message,
      skip: true
    };
  }
};

// Función para verificar el estado del servicio de email
const verificarServicioEmail = async () => {
  return await verificarConexionGmail();
};

const crearPlantillaRecuperacion = (nombre, enlaceRecuperacion) => {
  return {
    asunto: 'Recuperación de contraseña - Sistema de Créditos',
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
        background-color: #ffffff;
        border-radius: 10px;
        overflow: hidden; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }
      .content {
        padding: 30px;
        background: #f9fafb;
      }
      .welcome-text {
        font-size: 16px;
        color: #4b5563;
        margin-bottom: 20px;
      }
      .highlight {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .button {
        display: inline-block;
        background: #dc2626;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        margin: 15px 0;
        font-weight: bold;
        text-align: center;
      }
      .footer {
        text-align: center;
        padding: 20px;
        color: #6b7280;
        font-size: 14px;
        background: #f8f9fc;
        border-top: 1px solid #e5e7eb;
      } 
      .logo {
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 10px;
      }
      .warning {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
        color: #92400e;
        font-size: 14px;
      }
      .info-box {
        background: #dbeafe;
        border-left: 4px solid #2563eb;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">. Sistema de Créditos</div>
        <h1>Recuperación de Contraseña</h1>
      </div>
      <div class="content">
        <div class="welcome-text">
          <p>Estimado/a <strong>${nombre}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Créditos.</p>
          
          <div class="info-box">
            <p><strong>📋 Información de la solicitud:</strong></p>
            <p>• Tipo: Recuperación de contraseña</p>
            <p>• Solicitado: ${new Date().toLocaleString('es-ES')}</p>
            <p>• Expira: En 1 hora</p>
          </div>
          
          <div class="warning">
            <p><strong>. Importante:</strong></p>
            <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual permanecerá segura.</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${enlaceRecuperacion}" class="button" style="color: white;">
              . Restablecer Contraseña
            </a>
          </p>
          
          <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; font-size: 12px; color: #6b7280;">
            ${enlaceRecuperacion}
          </p>
          
          <p><strong>🔒 Seguridad:</strong></p>
          <p>Por tu seguridad, este enlace expirará en 1 hora. Si necesitas un nuevo enlace, puedes solicitar otra recuperación de contraseña.</p>
        </div>
      </div>
      <div class="footer">
        <p><strong>. Sistema de Créditos</strong></p>
        <p>Este es un mensaje automático de seguridad, por favor no responder este email.</p>
        <p>Si tienes alguna pregunta o necesitas asistencia, contacta a nuestro equipo de soporte.</p>
        <p>&copy; ${new Date().getFullYear()} Sistema de Créditos. Todos los derechos reservados.</p>
      </div>
    </div>
  </body>
</html>
    `,
    texto: `Recuperación de Contraseña - Sistema de Créditos

Hola ${nombre},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Créditos.

Información de la solicitud:
• Tipo: Recuperación de contraseña
• Solicitado: ${new Date().toLocaleString('es-ES')}
• Expira: En 1 hora

. Importante:
Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual permanecerá segura.

Para restablecer tu contraseña, haz clic en el siguiente enlace:
${enlaceRecuperacion}

Si el enlace no funciona, copia y pega la URL completa en tu navegador.

🔒 Seguridad:
Por tu seguridad, este enlace expirará en 1 hora. Si necesitas un nuevo enlace, puedes solicitar otra recuperación de contraseña.

Este es un mensaje automático de seguridad, por favor no responder este email.

© ${new Date().getFullYear()} Sistema de Créditos. Todos los derechos reservados.`
  };
};

// Función para enviar email de recuperación personalizado
const enviarEmailRecuperacionPersonalizado = async (email, nombre, enlaceRecuperacion) => {
  try {
    console.log(`📧 [RECUPERACIÓN] Preparando email de recuperación para: ${email}`);
    
    const plantilla = crearPlantillaRecuperacion(nombre, enlaceRecuperacion);
    
    // . CORRECCIÓN: usar enviarEmailGmail que ahora está importado
    const resultado = await enviarEmailGmail(
      email, 
      plantilla.asunto, 
      plantilla.html, 
      plantilla.texto
    );
    
    if (resultado.success) {
      console.log('. Email de recuperación enviado exitosamente');
    } else {
      console.warn('. Email de recuperación no enviado:', resultado.error);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('. Error en enviarEmailRecuperacionPersonalizado:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función principal para enviar email de recuperación
const enviarEmailRecuperacionContrasena = async (email, nombre, userId) => {
  try {
    console.log(`📧 [RECUPERACIÓN] Iniciando envío de email de recuperación para: ${email}`);
    
    // Verificar configuración de Gmail
    const configuracionValida = await verificarConexionGmail();
    
    if (!configuracionValida) {
      console.warn('. Configuración de Gmail no válida, no se enviará email de recuperación');
      return {
        success: false,
        error: 'Configuración de email no disponible',
        skip: true
      };
    }

    // Generar enlace de recuperación personalizado
    const tokenRecuperacion = Buffer.from(`${userId}:${email}:${Date.now()}:recuperacion`).toString('base64');
    const enlaceRecuperacion = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/resetear-contrasena?token=${tokenRecuperacion}`;
    
    console.log(`🔗 Enlace de recuperación generado: ${enlaceRecuperacion}`);
    
    // Enviar email personalizado
    const resultado = await enviarEmailRecuperacionPersonalizado(email, nombre, enlaceRecuperacion);
    
    if (resultado.success) {
      console.log('🎉 Email de recuperación enviado exitosamente');
    } else {
      console.warn('. Email de recuperación no enviado:', resultado.error);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('. Error en enviarEmailRecuperacionContrasena:', error);
    return {
      success: false,
      error: error.message,
      skip: true
    };
  }
};

module.exports = { 
  enviarEmailBienvenida,
  enviarEmailConfirmacionCuenta,
  enviarEmailRecuperacionContrasena, 
  verificarServicioEmail
};