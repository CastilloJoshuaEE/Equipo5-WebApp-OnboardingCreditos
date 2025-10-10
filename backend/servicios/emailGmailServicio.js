const nodemailer = require('nodemailer');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Configurar el transporter de Gmail
const crearTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    // MEJORAS: Configuraciones para evitar timeout
    connectionTimeout: 30000, // 30 segundos
    socketTimeout: 45000, // 45 segundos
    greetingTimeout: 30000,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  });
};

// Verificar conexión con Gmail
const verificarConexionGmail = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GMAIL] Intentando conexión (intento ${attempt}/${maxRetries})...`);
      
      const transporter = crearTransporter();
      await transporter.verify();
      
      console.log('. Conexión con Gmail SMTP establecida correctamente');
      return true;
    } catch (error) {
      console.error(`. Error en intento ${attempt}:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('. Error conectando a Gmail SMTP después de', maxRetries, 'intentos');
        return false;
      }
      
      // Esperar antes del próximo intento
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// Función principal para enviar emails con reintentos
const enviarEmailGmail = async (destinatario, asunto, contenidoHTML, contenidoTexto = '', maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`. [GMAIL] Intentando enviar email a: ${destinatario} (intento ${attempt}/${maxRetries})`);
      
      const transporter = crearTransporter();
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Sistema de Créditos'}" <${process.env.GMAIL_USER}>`,
        to: destinatario,
        subject: asunto,
        html: contenidoHTML,
        text: contenidoTexto || contenidoHTML.replace(/<[^>]*>/g, ''),
        // Prioridad normal
        priority: 'normal'
      };

      const resultado = await transporter.sendMail(mailOptions);
      
      console.log('. Email enviado exitosamente a:', destinatario);
      console.log('. ID del mensaje:', resultado.messageId);
      
      return {
        success: true,
        messageId: resultado.messageId,
        response: resultado.response,
        attempt: attempt
      };
      
    } catch (error) {
      console.error(`. Error en intento ${attempt}:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('. Error enviando email después de', maxRetries, 'intentos');
        return {
          success: false,
          error: error.message,
          code: error.code,
          attempt: attempt
        };
      }
      
      // Esperar antes del próximo intento (backoff exponencial)
      const waitTime = 3000 * attempt;
      console.log(`. Esperando ${waitTime}ms antes del próximo intento...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Plantilla de email de bienvenida
const crearPlantillaBienvenida = (nombre, rol) => {
  const asunto = rol === 'operador' 
    ? '¡Bienvenido Operador al Sistema de Créditos!' 
    : '¡Bienvenido Solicitante al Sistema de Créditos!';
  
  const mensaje = rol === 'operador'
    ? `Hola <strong>${nombre}</strong>, bienvenido como operador del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a gestionar solicitudes.`
    : `Hola <strong>${nombre}</strong>, bienvenido como solicitante del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a solicitar créditos para tu empresa.`;

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
            background: #dbeafe;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
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
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #6b7280; 
            font-size: 14px; 
            background: #f8fafc;
            border-top: 1px solid #e5e7eb;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">💼 Sistema de Créditos</div>
            <h1>${asunto}</h1>
        </div>
        <div class="content">
            <div class="welcome-text">
                <p>Estimado/a <strong>${nombre}</strong>,</p>
                <p>${mensaje}</p>
                
                <div class="highlight">
                    <p><strong>. Información de tu cuenta:</strong></p>
                    <p>• Rol: ${rol === 'operador' ? 'Operador del Sistema' : 'Solicitante de Créditos'}</p>
                    <p>• Estado: Cuenta activa y verificada</p>
                    <p>• Acceso: Puedes iniciar sesión inmediatamente</p>
                </div>
                
                <p><strong>. Próximos pasos:</strong></p>
                <p>1. Inicia sesión en el sistema con tu email y contraseña</p>
                <p>2. ${rol === 'operador' ? 'Revisa el dashboard de operador para gestionar solicitudes' : 'Completa tu perfil empresarial y comienza a solicitar créditos'}</p>
                <p>3. Explora todas las funcionalidades disponibles</p>
                
                <p style="text-align: center;">
                  <a href="${FRONTEND_URL}/login" class="button">Iniciar Sesión en el Sistema</a>
                </p>
            </div>
        </div>
        <div class="footer">
            <p><strong>💼 Sistema de Créditos</strong></p>
            <p>Este es un mensaje automático, por favor no responder este email.</p>
            <p>Si tienes alguna pregunta o necesitas asistencia, contacta a nuestro equipo de soporte.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Créditos. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
    `,
    texto: `${asunto}

Hola ${nombre},

${mensaje}

Información de tu cuenta:
• Rol: ${rol === 'operador' ? 'Operador del Sistema' : 'Solicitante de Créditos'}
• Estado: Cuenta activa y verificada
• Acceso: Puedes iniciar sesión inmediatamente

Próximos pasos:
1. Inicia sesión en el sistema con tu email y contraseña
2. ${rol === 'operador' ? 'Revisa el dashboard de operador para gestionar solicitudes' : 'Completa tu perfil empresarial y comienza a solicitar créditos'}
3. Explora todas las funcionalidades disponibles

Este es un mensaje automático, por favor no responder este email.

© ${new Date().getFullYear()} Sistema de Créditos. Todos los derechos reservados.`
  };
};

// Función específica para email de bienvenida
const enviarEmailBienvenidaGmail = async (email, nombre, rol) => {
  try {
    const plantilla = crearPlantillaBienvenida(nombre, rol);
    
    const resultado = await enviarEmailGmail(
      email, 
      plantilla.asunto, 
      plantilla.html, 
      plantilla.texto
    );
    
    return resultado;
    
  } catch (error) {
    console.error('. Error en enviarEmailBienvenidaGmail:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  enviarEmailBienvenidaGmail,
  enviarEmailGmail,
  verificarConexionGmail
};