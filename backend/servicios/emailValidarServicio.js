const axios = require('axios');

class emailValidarServicio {
  constructor() {
    this.services = [
      { name: 'AbstractAPI', method: this.verifyEmailAbstract.bind(this) },
      { name: 'BasicValidation', method: this.basicSyntaxValidation.bind(this) }
    ];
  }
  // . SERVICIO .: Abstract API
  async verifyEmailAbstract(email) {
    try {
      const apiKey = process.env.ABSTRACT_API_KEY;
      
      // Si no hay API key válida, saltar este servicio
      if (!apiKey || apiKey.includes('http') || apiKey.length < 10) {
        console.log('. Abstract API key no válida, usando validación básica');
        return null;
      }

      console.log(`. Usando Abstract API con key: ${apiKey.substring(0, 8)}...`);

      const response = await axios.get(`https://emailvalidation.abstractapi.com/v1/`, {
        params: {
          email: email,
          api_key: apiKey
        },
        timeout: 10000 // Aumentar timeout
      });

      console.log('. Respuesta de Abstract API:', JSON.stringify(response.data, null, 2));

      if (response.data) {
        const data = response.data;
        
        // . NUEVA LÓGICA . según la documentación
        const isValid = data.deliverability === 'DELIVERABLE' && 
                       data.is_valid_format?.value === true &&
                       data.quality_score > 0.5;

        return {
          valid: isValid,
          service: 'AbstractAPI',
          reason: `Deliverability: ${data.deliverability}, Score: ${data.quality_score}`,
          rawData: data // Para debugging
        };
      }
    } catch (error) {
      console.log('. Abstract API validation failed:', error.message);
      if (error.response) {
        console.log('. Detalles del error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      return null;
    }
  }

  // Servicio 4: Validación básica de sintaxis y DNS
  async basicSyntaxValidation(email) {
    try {
      // Validación básica de formato
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          valid: false,
          service: 'Syntax',
          reason: 'Formato de email inválido'
        };
      }

      // Extraer dominio
      const domain = email.split('@')[1];
      
      // Verificar dominios conocidos de mentira
      const fakeDomains = [
        'example.com', 'test.com', 'fake.com', 'invalid.com',
        'mailinator.com', 'guerrillamail.com', 'tempmail.com',
        '10minutemail.com', 'yopmail.com', 'trashmail.com'
      ];

      if (fakeDomains.includes(domain.toLowerCase())) {
        return {
          valid: false,
          service: 'DomainCheck',
          reason: 'Dominio de email temporal no permitido'
        };
      }

      // Verificar MX records del dominio (DNS lookup)
      const dns = require('dns').promises;
      try {
        await dns.resolveMx(domain);
        return {
          valid: true,
          service: 'DNS_MX',
          reason: 'Dominio tiene registros MX válidos'
        };
      } catch (dnsError) {
        return {
          valid: false,
          service: 'DNS_MX',
          reason: 'Dominio no tiene registros MX válidos'
        };
      }

    } catch (error) {
      return {
        valid: false,
        service: 'Syntax',
        reason: 'Error en validación básica'
      };
    }
  }

  // Método principal que prueba todos los servicios
  async validateEmail(email) {
    console.log(`. Validando email: ${email}`);
    
    let validationResults = [];

    // Probar todos los servicios
    for (const service of this.services) {
      try {
        const result = await service.method(email);
        if (result) {
          validationResults.push(result);
          console.log(`   ${result.service}: ${result.valid ? '.' : '.'} - ${result.reason}`);
        }
      } catch (error) {
        console.log(`   . ${service.name} failed: ${error.message}`);
      }
    }

    // Si no hay resultados de servicios externos, usar solo validación básica
    if (validationResults.length === 0) {
      console.log('ℹ️  No hay servicios externos disponibles, usando validación básica');
      const basicResult = await this.basicSyntaxValidation(email);
      validationResults.push(basicResult);
    }

    // Análisis de resultados
    const validResults = validationResults.filter(r => r.valid);
    const invalidResults = validationResults.filter(r => !r.valid);

    const finalResult = {
      email: email,
      isValid: validResults.length > 0, // . Cambiado: Solo necesita un servicio válido
      confidence: validResults.length / validationResults.length,
      servicesUsed: validationResults.length,
      details: validationResults,
      timestamp: new Date().toISOString()
    };

    console.log(`. Resultado final: ${finalResult.isValid ? '. VÁLIDO' : '. INVÁLIDO'} (confianza: ${Math.round(finalResult.confidence * 100)}%)`);

    return finalResult;
  }

  // Validación rápida (solo sintaxis y DNS)
  async quickValidate(email) {
    return await this.basicSyntaxValidation(email);
  }
    /**
   * Validar email antes de autenticación/registro
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   * @param {import('express').NextFunction} next 
   */
  async validateEmailBeforeAuth(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email es requerido'
        });
      }

      console.log(`. [VALIDACIÓN] Verificando email antes de registro: ${email}`);

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
      console.log(`. Email validado exitosamente: ${email}`);
      next();

    } catch (error) {
      console.error('. Error en validación de email:', error);
      
      // En caso de error, permitir el registro pero con advertencia
      console.warn('. Error en validación, permitiendo registro con advertencia');
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
  }

  /**
   * Middleware para solo verificación (sin bloquear)
   * @param {import('express').Request} req 
   * @param {import('express').Response} res 
   * @param {import('express').NextFunction} next 
   */
   async verifyEmailOnly(req, res, next) {
    try {
      const { email } = req.body;

      if (email) {
        const validation = await emailValidator.validateEmail(email);
        req.emailValidation = validation;
      }

      next();
    } catch (error) {
      console.log('. Verificación de email falló, continuando...');
      next();
    }
  }
}
const emailValidator = new emailValidarServicio();

module.exports = emailValidator;