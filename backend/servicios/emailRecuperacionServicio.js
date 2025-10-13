const brevoAPIService = require('./emailBrevoAPIService');

const enviarEmailRecuperacionCuenta = async (email, nombre, userId) => {
  try {
    console.log(`[RECUPERACIÓN] Preparando email de recuperación para: ${email}`);
    
    const tokenRecuperacion = generarTokenRecuperacion(userId, email);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const enlaceRecuperacion = `${frontendUrl}/api/auth/restablecer-cuenta?token=${tokenRecuperacion}&email=${encodeURIComponent(email)}`;    
    const asunto = 'Recuperación de cuenta - Sistema de créditos';
    const contenidoHTML = crearPlantillaRecuperacionHTML(nombre, enlaceRecuperacion);
    const contenidoTexto = crearPlantillaRecuperacionTexto(nombre, enlaceRecuperacion);
    
    const resultado = await brevoAPIService.enviarEmail(
      email,
      asunto,
      contenidoHTML,
      contenidoTexto,
      'Sistema de créditos - Recuperación'
    );
    
    if (resultado.success) {
      console.log('Email de recuperación enviado exitosamente');
    }
    
    return resultado;
  } catch (error) {
    console.error('Error en enviarEmailRecuperacionCuenta', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Función específica para reactivación
const enviarEmailReactivacionCuenta = async (email, nombre, userId) => {
  try {
    console.log(`[REACTIVACIÓN] Preparando email de reactivación para: ${email}`);
    
    const tokenReactivacion = generarTokenRecuperacion(userId, email);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const enlaceReactivacion = `${frontendUrl}/reactivar-cuenta?token=${tokenReactivacion}&email=${encodeURIComponent(email)}`;
    
    const asunto = 'Reactivación de cuenta - Sistema de créditos';
    const contenidoHTML = crearPlantillaReactivacionHTML(nombre, enlaceReactivacion);
    const contenidoTexto = crearPlantillaReactivacionTexto(nombre, enlaceReactivacion);
    
    const resultado = await brevoAPIService.enviarEmail(
      email,
      asunto,
      contenidoHTML,
      contenidoTexto,
      'Sistema de créditos - Reactivación'
    );
    
    return resultado;
  } catch (error) {
    console.error('Error en enviarEmailReactivacionCuenta', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const generarTokenRecuperacion = (userId, email) => {
  const timestamp = Date.now();
  const tokenData = `${userId}:${email}:${timestamp}:recuperacion`;
  return Buffer.from(tokenData).toString('base64');
};

const crearPlantillaReactivacionHTML = (nombre, enlaceReactivacion) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
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
            background: linear-gradient(135deg, #059669, #047857);
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
            background: #059669;
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
        }
        .info {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reactivación de Cuenta</h1>
        </div>
        <div class="content">
            <p>Estimado/a <strong>${nombre}</strong>,</p>
            <p>Hemos recibido una solicitud para reactivar tu cuenta en el Sistema de Créditos.</p>
            
            <div class="info">
                <p><strong>Información importante:</strong></p>
                <p>Tu cuenta estaba desactivada y ahora puede ser reactivada.</p>
            </div>
            
            <p style="text-align: center;">
                <a href="${enlaceReactivacion}" class="button">Reactivar Mi Cuenta</a>
            </p>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${enlaceReactivacion}</p>
            
            <p><strong>Este enlace expirará en 1 hora por seguridad.</strong></p>
            
            <p>Si no solicitaste esta reactivación, puedes ignorar este mensaje.</p>
        </div>
        <div class="footer">
            <p>Sistema de Créditos - Seguridad</p>
        </div>
    </div>
</body>
</html>`;
};

const crearPlantillaReactivacionTexto = (nombre, enlaceReactivacion) => {
  return `Reactivación de cuenta - Sistema de créditos

Hola ${nombre},

Hemos recibido una solicitud para reactivar tu cuenta en el Sistema de Créditos.

Tu cuenta estaba desactivada y ahora puede ser reactivada.

Para reactivar tu cuenta, haz clic en el siguiente enlace:
${enlaceReactivacion}

IMPORTANTE: Si no solicitaste esta reactivación, puedes ignorar este mensaje.

Este enlace expirará en 1 hora por seguridad.

Sistema de Créditos - Seguridad`;
};
const crearPlantillaRecuperacionHTML = (nombre, enlaceRecuperacion) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
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
            background: linear-gradient(135deg, #dc2626, #b91c1c);
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
            background: #dc2626;
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
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Recuperación de Cuenta</h1>
        </div>
        <div class="content">
            <p>Estimado/a <strong>${nombre}</strong>,</p>
            <p>Hemos recibido una solicitud para recuperar el acceso a tu cuenta en el Sistema de Créditos.</p>
            
            <p style="text-align: center;">
                <a href="${enlaceRecuperacion}" class="button">Recuperar Mi Cuenta</a>
            </p>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${enlaceRecuperacion}</p>
            
            <p><strong>Este enlace expirará en 1 hora por seguridad.</strong></p>
            
            <p>Si no solicitaste esta recuperación, puedes ignorar este mensaje.</p>
        </div>
        <div class="footer">
            <p>Sistema de Créditos - Seguridad</p>
        </div>
    </div>
</body>
</html>`;
};

const crearPlantillaRecuperacionTexto = (nombre, enlaceRecuperacion) => {
  return `Recuperación de cuenta - Sistema de créditos

Hola ${nombre},

Hemos recibido una solicitud para recuperar el acceso a tu cuenta en el Sistema de Créditos.

Para recuperar tu cuenta, haz clic en el siguiente enlace:
${enlaceRecuperacion}

IMPORTANTE: Si no solicitaste esta recuperación, puedes ignorar este mensaje.

Este enlace expirará en 1 hora por seguridad.

Sistema de Créditos - Seguridad`;
};
module.exports = {
  enviarEmailRecuperacionCuenta,
  enviarEmailReactivacionCuenta,
  generarTokenRecuperacion,
  crearPlantillaRecuperacionHTML,
  crearPlantillaRecuperacionTexto,
  crearPlantillaReactivacionHTML, 
  crearPlantillaReactivacionTexto
};