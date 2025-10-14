const brevoAPIService = require('./emailBrevoAPIService');

const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com';
  }
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

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
    
    // CORRECCIÓN: Usar FRONTEND_URL en lugar de BACKEND_URL
    const frontendUrl = getFrontendUrl();
    const enlaceConfirmacion = `${frontendUrl}/api/auth/confirmar?token=${tokenConfirmacion}&email=${encodeURIComponent(email)}`;
    
    const resultado = await brevoAPIService.enviarEmailConfirmacion(email, nombre, enlaceConfirmacion);
    
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
  generarTokenConfirmacion,
  getFrontendUrl
};