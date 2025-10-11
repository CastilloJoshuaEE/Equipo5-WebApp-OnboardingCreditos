const axios = require('axios');

class BrevoAPIService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.baseURL = 'https://api.brevo.com/v3';
  }

  // Verificar conexión con la API
  async verificarConexion() {
    try {
      const response = await axios.get(`${this.baseURL}/account`, {
        headers: {
          'api-key': this.apiKey
        }
      });
      
      console.log('. Conexión con Brevo API establecida correctamente');
      return true;
    } catch (error) {
      console.error('. Error conectando a Brevo API:', error.response?.data || error.message);
      return false;
    }
  }

  // Función para compatibilidad
  async verificarConexionBrevo() {
    return await this.verificarConexion();
  }

  // Enviar email transaccional
  async enviarEmail(destinatario, asunto, contenidoHTML, contenidoTexto = '', nombreRemitente = null) {
    try {
      console.log(`. [BREVO API] Enviando email a: ${destinatario}`);

      const emailData = {
        sender: {
          name: nombreRemitente || process.env.EMAIL_FROM_NAME || 'Sistema de Créditos',
          email: process.env.EMAIL_FROM_EMAIL || 'no-reply@creditos.com'
        },
        to: [
          {
            email: destinatario,
            name: destinatario.split('@')[0]
          }
        ],
        subject: asunto,
        htmlContent: contenidoHTML,
        textContent: contenidoTexto || contenidoHTML.replace(/<[^>]*>/g, ''),
        tags: ['confirmacion', 'sistema-creditos']
      };

      const response = await axios.post(`${this.baseURL}/smtp/email`, emailData, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        timeout: 30000
      });

      console.log('. Email enviado exitosamente via Brevo API');
      console.log('. ID del mensaje:', response.data.messageId);

      return {
        success: true,
        messageId: response.data.messageId,
        data: response.data
      };

    } catch (error) {
      console.error('. Error enviando email via Brevo API:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      return {
        success: false,
        error: error.response?.data || error.message,
        code: error.response?.status
      };
    }
  }

  // Método específico para email de confirmación
async enviarEmailConfirmacion(email, nombre, enlaceConfirmacion) {
  const asunto = 'Confirma tu email - Sistema de Créditos';
  
  const contenidoHTML = this.crearPlantillaConfirmacionHTML(nombre, enlaceConfirmacion);
  const contenidoTexto = this.crearPlantillaConfirmacionTexto(nombre, enlaceConfirmacion);

  return await this.enviarEmail(email, asunto, contenidoHTML, contenidoTexto, 'Sistema de Créditos');
}

  // Método específico para email de bienvenida
  async enviarEmailBienvenida(email, nombre, rol) {
    const asunto = rol === 'operador' 
      ? '¡Bienvenido Operador al Sistema de Créditos!' 
      : '¡Bienvenido Solicitante al Sistema de Créditos!';
    
    const contenidoHTML = this.crearPlantillaBienvenidaHTML(nombre, rol);
    const contenidoTexto = this.crearPlantillaBienvenidaTexto(nombre, rol);

    return await this.enviarEmail(email, asunto, contenidoHTML, contenidoTexto, 'Sistema de Créditos');
  }

  // Plantillas HTML
  crearPlantillaConfirmacionHTML(nombre, enlaceConfirmacion) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f8fafc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Confirma tu Email</h1>
        </div>
        <div class="content">
            <p>Estimado/a <strong>${nombre}</strong>,</p>
            <p>¡Gracias por registrarte en el Sistema de Créditos! Para activar tu cuenta, confirma tu dirección de email.</p>
            
            <p style="text-align: center;">
                <a href="${enlaceConfirmacion}" class="button">Confirmar Mi Email</a>
            </p>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${enlaceConfirmacion}</p>
            
            <p><strong>Este enlace expirará en 24 horas.</strong></p>
        </div>
        <div class="footer">
            <p>Sistema de Créditos</p>
        </div>
    </div>
</body>
</html>`;
  }

  crearPlantillaBienvenidaHTML(nombre, rol) {
    const mensaje = rol === 'operador'
      ? `Hola <strong>${nombre}</strong>, bienvenido como operador del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a gestionar solicitudes.`
      : `Hola <strong>${nombre}</strong>, bienvenido como solicitante del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a solicitar créditos para tu empresa.`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f8fafc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${rol === 'operador' ? '¡Bienvenido Operador!' : '¡Bienvenido Solicitante!'}</h1>
        </div>
        <div class="content">
            <p>${mensaje}</p>
            
            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Iniciar Sesión</a>
            </p>
        </div>
        <div class="footer">
            <p>Sistema de Créditos</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Plantillas de texto
  crearPlantillaConfirmacionTexto(nombre, enlaceConfirmacion) {
    return `Confirma tu email - Sistema de Créditos

Hola ${nombre},

¡Gracias por registrarte! Para activar tu cuenta, confirma tu dirección de email haciendo clic en el siguiente enlace:

${enlaceConfirmacion}

Este enlace expirará en 24 horas.

Sistema de Créditos`;
  }

  crearPlantillaBienvenidaTexto(nombre, rol) {
    const mensaje = rol === 'operador'
      ? `Hola ${nombre}, bienvenido como operador del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a gestionar solicitudes.`
      : `Hola ${nombre}, bienvenido como solicitante del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a solicitar créditos para tu empresa.`;

    return `${rol === 'operador' ? '¡Bienvenido Operador!' : '¡Bienvenido Solicitante!'}

${mensaje}

Inicia sesión en: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Sistema de Créditos`;
  }
}


// Instancia singleton
const brevoAPIService = new BrevoAPIService();

// Exportar funciones individuales para compatibilidad
module.exports = brevoAPIService;
module.exports.verificarConexionBrevo = brevoAPIService.verificarConexionBrevo.bind(brevoAPIService);