const brevoAPIService = require('./emailBrevoAPIService');

const getFrontendUrl = () => {
  // En producción, usar siempre el dominio de Render
  if (process.env.NODE_ENV === 'production') {
    return 'https://nexia-sigma.vercel.app';
    //'https://equipo5-webapp-onboardingcreditos-orxk.onrender.com';
  }
  
  // En desarrollo
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

// Generar token de confirmación
const generarTokenConfirmacion = (userId, email) => {
  const timestamp = Date.now();
  return Buffer.from(`${userId}:${email}:${timestamp}`).toString('base64');
};

// Función principal para enviar email de confirmación
const enviarEmailConfirmacion = async (email, nombre, userId) => {
  try {
    console.log(`. [CONFIRMACIÓN] Preparando email de confirmación para: ${email}`);
    
    const tokenConfirmacion = generarTokenConfirmacion(userId, email);
    
    const frontendUrl = getFrontendUrl();
    const enlaceConfirmacion = `${frontendUrl}/email_confirmado?token=${tokenConfirmacion}&email=${encodeURIComponent(email)}`;
    
    console.log(`. [CONFIRMACIÓN] Enlace de confirmación generado: ${enlaceConfirmacion}`);
    
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