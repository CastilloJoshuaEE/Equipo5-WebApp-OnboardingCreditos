const { enviarEmailGmail } = require('./emailGmailServicio');
const { supabaseAdmin } = require('../config/supabaseAdmin.js'); // . AGREGAR ESTA IMPORTACIÓN

// Generar token de confirmación
const generarTokenConfirmacion = (userId, email) => {
  return Buffer.from(`${userId}:${email}:${Date.now()}`).toString('base64');
};

// Plantilla de email con botón de confirmación
const crearPlantillaConfirmacion = (nombre, tokenConfirmacion) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  const enlaceConfirmacion = `${FRONTEND_URL}/api/auth/confirmar?token=${tokenConfirmacion}`;
  
  return {
    asunto: 'Confirma tu email - Sistema de Créditos',
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
            text-align: center;
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
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">💼 Sistema de Créditos</div>
            <h1>Confirma tu Email</h1>
        </div>
        <div class="content">
            <div class="welcome-text">
                <p>Estimado/a <strong>${nombre}</strong>,</p>
                <p>¡Gracias por registrarte en el Sistema de Créditos! Para activar tu cuenta y comenzar a utilizar nuestros servicios, necesitas confirmar tu dirección de email.</p>
                
                <div class="highlight">
                    <p><strong>. Información de tu cuenta:</strong></p>
                    <p>• Estado: Pendiente de confirmación</p>
                    <p>• Acceso: Disponible después de confirmar email</p>
                </div>
                
                <div class="warning">
                    <p><strong>. Importante:</strong></p>
                    <p>Debes confirmar tu email antes de poder iniciar sesión en el sistema.</p>
                </div>
                
                <p style="text-align: center;">
                    <a href="${enlaceConfirmacion}" class="button" style="color: white;">
                        . Confirmar Mi Email
                    </a>
                </p>
                
                <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; font-size: 12px; color: #6b7280;">
                    ${enlaceConfirmacion}
                </p>
                
                <p><strong>¿Problemas con la confirmación?</strong></p>
                <p>Si tienes dificultades para confirmar tu email o no solicitaste este registro, por favor contacta a nuestro equipo de soporte.</p>
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
    texto: `Confirma tu email - Sistema de Créditos

Hola ${nombre},

¡Gracias por registrarte en el Sistema de Créditos! Para activar tu cuenta y comenzar a utilizar nuestros servicios, necesitas confirmar tu dirección de email.

Información de tu cuenta:
• Estado: Pendiente de confirmación
• Acceso: Disponible después de confirmar email

. Importante:
Debes confirmar tu email antes de poder iniciar sesión en el sistema.

Para confirmar tu email, haz clic en el siguiente enlace:
${enlaceConfirmacion}

Si el enlace no funciona, copia y pega la URL completa en tu navegador.

¿Problemas con la confirmación?
Si tienes dificultades para confirmar tu email o no solicitaste este registro, por favor contacta a nuestro equipo de soporte.

Este es un mensaje automático, por favor no responder este email.

© ${new Date().getFullYear()} Sistema de Créditos. Todos los derechos reservados.`
  };
};

// Función principal para enviar email de confirmación
const enviarEmailConfirmacion = async (email, nombre, userId) => {
  try {
    console.log(`. [CONFIRMACIÓN] Preparando email de confirmación para: ${email}`);
    
    const tokenConfirmacion = generarTokenConfirmacion(userId, email);
    const plantilla = crearPlantillaConfirmacion(nombre, tokenConfirmacion);
    
    const resultado = await enviarEmailGmail(
      email, 
      plantilla.asunto, 
      plantilla.html, 
      plantilla.texto
    );
    
    if (resultado.success) {
      console.log('. Email de confirmación enviado exitosamente');
    }
    
    return resultado;
    
  } catch (error) {
    console.error('. Error en enviarEmailConfirmacion:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  enviarEmailConfirmacion,
  generarTokenConfirmacion,
  crearPlantillaConfirmacion
};