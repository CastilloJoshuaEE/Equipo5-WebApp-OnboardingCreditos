const axios = require('axios');

class emailValidarServicio {
  constructor() {
    this.services = [
      this.verifyEmailHubSpot,
      this.verifyEmailHunter,
      this.verifyEmailAbstract,
      this.basicSyntaxValidation
    ];
  }

  // Servicio 1: HubSpot Email Verification
  async verifyEmailHubSpot(email) {
    try {
      const response = await axios.get(`https://api.hubapi.com/email-verification/v1/verify`, {
        params: {
          email: email,
          access_token: process.env.HUBSPOT_ACCESS_TOKEN || 'demo'
        },
        timeout: 5000
      });

      if (response.data && response.data.status) {
        return {
          valid: response.data.status === 'valid',
          service: 'HubSpot',
          reason: response.data.reason || 'Validación exitosa'
        };
      }
    } catch (error) {
      console.log('. HubSpot validation failed, trying next service...');
      return null;
    }
  }

  // Servicio 2: Email Hunter
  async verifyEmailHunter(email) {
    try {
      const response = await axios.get(`https://api.hunter.io/v2/email-verifier`, {
        params: {
          email: email,
          api_key: process.env.EMAIL_HUNTER_API_KEY || 'demo'
        },
        timeout: 5000
      });

      if (response.data && response.data.data) {
        const result = response.data.data;
        return {
          valid: result.status === 'valid',
          service: 'EmailHunter',
          reason: result.result || 'Validación exitosa'
        };
      }
    } catch (error) {
      console.log('. Email Hunter validation failed, trying next service...');
      return null;
    }
  }

  // . SERVICIO 3 .: Abstract API
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

      console.log('📊 Respuesta de Abstract API:', JSON.stringify(response.data, null, 2));

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
        console.log('📋 Detalles del error:', {
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
    console.log(`🔍 Validando email: ${email}`);
    
    let validationResults = [];

    // Probar todos los servicios
    for (const service of this.services) {
      try {
        const result = await service.call(this, email);
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

    console.log(`📊 Resultado final: ${finalResult.isValid ? '. VÁLIDO' : '. INVÁLIDO'} (confianza: ${Math.round(finalResult.confidence * 100)}%)`);

    return finalResult;
  }

  // Validación rápida (solo sintaxis y DNS)
  async quickValidate(email) {
    return await this.basicSyntaxValidation(email);
  }
}

// Instancia singleton
const emailValidator = new emailValidarServicio();

module.exports = emailValidator;