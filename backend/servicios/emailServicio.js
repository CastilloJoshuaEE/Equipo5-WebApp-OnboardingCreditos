const brevoAPIService = require('./emailBrevoAPIService');
const { generarTokenConfirmacion, getFrontendUrl } = require('./emailConfirmacionServicio');
const {enviarEmailRecuperacionCuenta}= require('./emailRecuperacionServicio');
const enviarEmailBienvenida = async (email, nombre, rol) => {
  try {
    console.log(`. [BREVO API] Intentando enviar email de bienvenida a: ${email}`);
    
    const resultado = await brevoAPIService.enviarEmailBienvenida(email, nombre, rol);
    
    if (resultado.success) {
      console.log('. Email de bienvenida enviado exitosamente via Brevo API');
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
// En emailServicio.js - Agregar método para enviar emails con adjuntos
const enviarEmail = async (opcionesEmail) => {
    try {
        const { to, subject, text, html, attachments = [] } = opcionesEmail;
        
        // Validar formato del destinatario
        let destinatarioFormateado;
        if (typeof to === 'string') {
            destinatarioFormateado = to;
        } else if (to && to.email) {
            destinatarioFormateado = to.email;
        } else {
            throw new Error('Formato de destinatario inválido. Se esperaba string u objeto con email.');
        }

        console.log(`. [EMAIL SERVICE] Enviando email a: ${destinatarioFormateado}`);

        // PREPARAR ADJUNTOS EN FORMATO CORRECTO
        const adjuntosFormateados = attachments.map(adjunto => {
            // Si ya está en base64
            if (typeof adjunto.content === 'string') {
                return {
                    name: adjunto.filename || adjunto.name || `adjunto-${Date.now()}.pdf`,
                    content: adjunto.content
                };
            }
            // Si es un buffer, convertirlo a base64
            else if (adjunto.content instanceof Buffer) {
                return {
                    name: adjunto.filename || adjunto.name || `adjunto-${Date.now()}.pdf`,
                    content: adjunto.content.toString('base64')
                };
            }
            // Si tiene data en base64
            else if (adjunto.data) {
                return {
                    name: adjunto.filename || adjunto.name,
                    content: adjunto.data.toString('base64')
                };
            }
        }).filter(Boolean);

        console.log(`. Número de adjuntos formateados: ${adjuntosFormateados.length}`);

        // Usando Brevo API para enviar emails con adjuntos
        const resultado = await brevoAPIService.enviarEmailConAdjuntos(
            destinatarioFormateado, 
            subject, 
            html || text, 
            adjuntosFormateados
        );
        
        return resultado;
    } catch (error) {
        console.error('Error enviando email con adjuntos:', error);
        return { success: false, error: error.message };
    }
}
const enviarEmailConfirmacionCuenta = async (email, nombre, userId) => {
  try {
    console.log(`. [CONFIRMACIÓN] Enviando email de confirmación a: ${email}`);
    
    const tokenConfirmacion = generarTokenConfirmacion(userId, email);
    
    // .: Usar FRONTEND_URL
    const frontendUrl = getFrontendUrl();
    const enlaceConfirmacion = `${frontendUrl}/api/auth/confirmar?token=${tokenConfirmacion}&email=${encodeURIComponent(email)}`;
    
    const resultado = await brevoAPIService.enviarEmailConfirmacion(email, nombre, enlaceConfirmacion);
    
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

const verificarServicioEmail = async () => {
  return await brevoAPIService.verificarConexion();
};

module.exports = {
  enviarEmail,
  enviarEmailBienvenida,
  enviarEmailConfirmacionCuenta,
  verificarServicioEmail,
  enviarEmailRecuperacionCuenta
};