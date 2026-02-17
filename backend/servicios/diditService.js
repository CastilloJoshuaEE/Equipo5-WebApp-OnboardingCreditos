const axios = require('axios');

class DiditService {
  constructor() {
    this.apiKey = process.env.DIDIT_API_KEY;
    this.baseURL = 'https://verification.didit.me/v2';
    this.webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;
  }

  // Crear sesión de verificación KYC
  async createVerificationSession(userData, workflowId = 'kyc_basic') {
    try {
      console.log('. Creando sesión de verificación Didit para:', userData.email);
      
      const response = await axios.post(`${this.baseURL}/session/`, {
        workflow_id: workflowId,
        callback: `${process.env.BACKEND_URL}/api/webhooks/didit`,
        vendor_data: userData.userId,
        metadata: {
          user_type: 'pyme_solicitante',
          company_name: userData.companyName
        },
        contact_details: {
          email: userData.email,
          email_lang: 'es',
          phone: userData.phone
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey
        }
      });

      console.log('. Sesión Didit creada:', response.data.session_id);
      return {
        success: true,
        sessionId: response.data.session_id,
        verificationUrl: response.data.url
      };
    } catch (error) {
      console.error('. Error creando sesión Didit:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

async verifyIdentity(archivoBuffer) {
  try {
    console.log('. Iniciando verificación de identidad con Didit...');
    
    // SIMULACIÓN EN MODO DESARROLLO
    if (process.env.NODE_ENV === 'development') {
      console.log('. .  MODO DESARROLLO: Simulando verificación Didit');
      
      return {
        success: true,
        data: {
          session_id: `didit_dev_${Date.now()}`,
          id_verification: {
            status: 'Approved',
            score: 0.95,
            verification_date: new Date().toISOString(),
            document_type: 'DNI',
            document_number: '0977777777',
            full_name: 'JOSHUA JAVIER CASTILLO',
            birth_date: '2004-07-01',
            nationality: 'AR'
          },
          document_analysis: {
            type: 'DNI',
            country: 'AR'
          }
        }
      };
    }

    // CÓDIGO ORIGINAL PARA PRODUCCIÓN
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('front_image', archivoBuffer, {
      filename: 'documento_dni.pdf',
      contentType: 'application/pdf'
    });
    
    formData.append('perform_document_liveness', 'true');
    formData.append('vendor_data', 'identity_verification_pyme');

    console.log('. Enviando documento a Didit...');
    
    const response = await axios.post(`${this.baseURL}/id-verification/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Api-Key': this.apiKey,
        ...formData.getHeaders()
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('. Respuesta de Didit recibida');
    
    const responseData = response.data;
    
    return {
      success: true,
      data: {
        session_id: responseData.session_id || `didit_${Date.now()}`,
        id_verification: {
          status: responseData.status || 'Approved',
          score: responseData.score || 0.95,
          verification_date: new Date().toISOString()
        },
        document_analysis: responseData.document_analysis || {
          type: 'DNI',
          country: 'AR'
        },
        ...responseData
      }
    };
  } catch (error) {
    console.error('. Error detallado en verificación Didit:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}
  // Screening AML
  async performAMLscreening(userData) {
    try {
      const response = await axios.post(`${this.baseURL}/aml-screening/`, {
        first_name: userData.firstName,
        last_name: userData.lastName,
        date_of_birth: userData.birthDate,
        nationality: userData.nationality,
        vendor_data: userData.userId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey
        }
      });

      return {
        success: true,
        amlResult: response.data
      };
    } catch (error) {
      console.error('. Error en screening AML:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Obtener resultados de sesión
   async getSessionResults(sessionId) {
    try {
      const response = await axios.get(`${this.baseURL}/session/${sessionId}/decision/`, {
        headers: {
          'X-Api-Key': this.apiKey
        }
      });

      return {
        success: true,
        results: response.data
      };
    } catch (error) {
      console.error('. Error obteniendo resultados:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
  // Verificar firma de webhook
  verifyWebhookSignature(payload, signature, timestamp) {
    const crypto = require('crypto');
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Verificar timestamp (5 minutos de margen)
    if (Math.abs(currentTime - timestamp) > 300) {
      return false;
    }

    // Verificar firma
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const expectedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  }
}


module.exports = new DiditService();