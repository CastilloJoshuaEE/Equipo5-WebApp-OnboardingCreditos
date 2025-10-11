const brevoAPIService = require('./emailBrevoAPIService');

// Generar token de confirmación (mantener igual)
const generarTokenConfirmacion = (userId, email) => {
  const timestamp = Date.now();
  return Buffer.from(`${userId}:${email}:${timestamp}`).toString('base64');
};

// Función principal para enviar email de confirmación
const enviarEmailConfirmacion = async (email, nombre, userId) => {
  try {
    console.log(`. [CONFIRMACIÓN] Preparando email de confirmación para: ${email}`);
    
    const tokenConfirmacion = generarTokenConfirmacion(userId, email);
    const resultado = await brevoAPIService.enviarEmailConfirmacion(email, nombre, tokenConfirmacion);
    
    if (resultado.success) {
      console.log('. Email de confirmación enviado exitosamente via Brevo API');
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
  generarTokenConfirmacion
};