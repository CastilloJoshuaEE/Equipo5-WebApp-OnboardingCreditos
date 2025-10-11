const brevoAPIService = require('./emailBrevoAPIService');
const { generarTokenConfirmacion, getFrontendUrl } = require('./emailConfirmacionServicio');

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
const enviarEmailConfirmacionCuenta = async (email, nombre, userId) => {
  try {
    console.log(`. [CONFIRMACIÓN] Enviando email de confirmación a: ${email}`);
    
    const tokenConfirmacion = generarTokenConfirmacion(userId, email);
    
    // CORRECCIÓN: Usar FRONTEND_URL
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
  enviarEmailBienvenida,
  enviarEmailConfirmacionCuenta,
  verificarServicioEmail
};