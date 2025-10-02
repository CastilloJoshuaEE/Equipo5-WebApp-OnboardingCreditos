const { 
  enviarEmailBienvenidaGmail, 
  verificarConexionGmail 
} = require('./emailGmailServicio');

const { 
  enviarEmailConfirmacion 
} = require('./emailConfirmacionServicio');

// Función principal mejorada
const enviarEmailBienvenida = async (email, nombre, rol) => {
  try {
    console.log(`📧 [GMAIL] Intentando enviar email de bienvenida a: ${email}`);
    
    // Verificar configuración de Gmail
    const configuracionValida = await verificarConexionGmail();
    
    if (!configuracionValida) {
      console.warn('. Configuración de Gmail no válida, no se enviará email');
      return {
        success: false,
        error: 'Configuración de email no disponible',
        skip: true
      };
    }

    // Enviar email usando Gmail
    const resultado = await enviarEmailBienvenidaGmail(email, nombre, rol);
    
    if (resultado.success) {
      console.log('🎉 Email de bienvenida enviado exitosamente via Gmail');
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

// . NUEVA FUNCIÓN: Enviar email de confirmación
const enviarEmailConfirmacionCuenta = async (email, nombre, userId) => {
  try {
    console.log(`📧 [CONFIRMACIÓN] Enviando email de confirmación a: ${email}`);
    
    const configuracionValida = await verificarConexionGmail();
    
    if (!configuracionValida) {
      console.warn('. Configuración de Gmail no válida, no se enviará email de confirmación');
      return {
        success: false,
        error: 'Configuración de email no disponible',
        skip: true
      };
    }

    const resultado = await enviarEmailConfirmacion(email, nombre, userId);
    
    if (resultado.success) {
      console.log('🎉 Email de confirmación enviado exitosamente');
    } else {
      console.warn('. Email de confirmación no enviado:', resultado.error);
    }
    
    return resultado;
    
  } catch (error) {
    console.error('. Error en servicio de confirmación:', error);
    return {
      success: false,
      error: error.message,
      skip: true
    };
  }
};

// Función para verificar el estado del servicio de email
const verificarServicioEmail = async () => {
  return await verificarConexionGmail();
};

module.exports = { 
  enviarEmailBienvenida,
  enviarEmailConfirmacionCuenta, 
  verificarServicioEmail
};
