const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789'); 

const enviarEmailBienvenida = async (email, nombre, rol) => {
  try {
    console.log(`📧 Intentando enviar email a: ${email}`);
    
    const asunto = rol === 'operador' 
      ? '¡Bienvenido Operador!' 
      : '¡Bienvenido Solicitante!';
    
    const mensaje = rol === 'operador'
      ? `Hola ${nombre}, bienvenido como operador del sistema de créditos. Tu cuenta ha sido creada exitosamente.`
      : `Hola ${nombre}, bienvenido como solicitante del sistema de créditos. Tu cuenta ha sido creada exitosamente.`;

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: 'Sistema de Créditos <onboarding@resend.dev>',
      to: [email],
      subject: asunto,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9fafb; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
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
                    <p>Ahora puedes acceder al sistema con tu email y contraseña.</p>
                    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático, por favor no responder.</p>
                    <p>&copy; 2024 Sistema de Créditos. Todos los derechos reservados.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `${asunto}\n\nHola ${nombre},\n\n${mensaje}\n\nAhora puedes acceder al sistema con tu email y contraseña.\n\nEste es un mensaje automático, por favor no responder.`
    });

    if (error) {
      console.error('❌ Error enviando email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email de bienvenida enviado exitosamente a:', email);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error en servicio de email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { enviarEmailBienvenida };