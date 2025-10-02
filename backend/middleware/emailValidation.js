const emailValidator = require('../servicios/emailValidationService');

const validateEmailBeforeAuth = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    console.log(`📧 [VALIDACIÓN] Verificando email antes de registro: ${email}`);

    // Validación rápida primero
    const quickValidation = await emailValidator.quickValidate(email);
    
    if (!quickValidation.valid) {
      return res.status(400).json({
        success: false,
        message: `Email inválido: ${quickValidation.reason}`,
        validation: quickValidation
      });
    }

    // Si la validación rápida pasa, hacer validación completa
    const fullValidation = await emailValidator.validateEmail(email);

    if (!fullValidation.isValid) {
      const reasons = fullValidation.details
        .filter(d => !d.valid)
        .map(d => d.reason)
        .join(', ');

      return res.status(400).json({
        success: false,
        message: `El email no parece ser válido. Razones: ${reasons}`,
        validation: fullValidation
      });
    }

    // Email válido, agregar resultado a la request
    req.emailValidation = fullValidation;
    console.log(`✅ Email validado exitosamente: ${email}`);
    next();

  } catch (error) {
    console.error('❌ Error en validación de email:', error);
    
    // En caso de error, permitir el registro pero con advertencia
    console.warn('⚠️ Error en validación, permitiendo registro con advertencia');
    req.emailValidation = {
      email: req.body.email,
      isValid: true,
      confidence: 0.5,
      servicesUsed: 0,
      details: [{ valid: true, service: 'Error', reason: 'Validación falló, permitiendo registro' }],
      warning: 'Validación falló pero se permite el registro'
    };
    next();
  }
};

// Middleware para solo verificación (sin bloquear)
const verifyEmailOnly = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (email) {
      const validation = await emailValidator.validateEmail(email);
      req.emailValidation = validation;
    }

    next();
  } catch (error) {
    console.log('⚠️ Verificación de email falló, continuando...');
    next();
  }
};

module.exports = {
  validateEmailBeforeAuth,
  verifyEmailOnly
};