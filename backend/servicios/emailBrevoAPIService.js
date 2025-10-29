const axios = require('axios');

class BrevoAPIService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.baseURL = 'https://api.brevo.com/v3';
  }

  // Verificar conexión con la API
  async verificarConexion() {
    try {
      const response = await axios.get(`${this.baseURL}/account`, {
        headers: {
          'api-key': this.apiKey
        }
      });
      
      console.log('. Conexión con Brevo API establecida correctamente');
      return true;
    } catch (error) {
      console.error('. Error conectando a Brevo API:', error.response?.data || error.message);
      return false;
    }
  }

  // Función para compatibilidad
  async verificarConexionBrevo() {
    return await this.verificarConexion();
  }

  // Enviar email transaccional
  async enviarEmail(destinatario, asunto, contenidoHTML, contenidoTexto = '', nombreRemitente = null) {
    try {
      console.log(`. [BREVO API] Enviando email a: ${destinatario}`);

      const emailData = {
        sender: {
          name: nombreRemitente || process.env.EMAIL_FROM_NAME || 'Sistema de Créditos',
          email: process.env.EMAIL_FROM_EMAIL || 'no-reply@creditos.com'
        },
        to: [
          {
            email: destinatario,
            name: destinatario.split('@')[0]
          }
        ],
        subject: asunto,
        htmlContent: contenidoHTML,
        textContent: contenidoTexto || contenidoHTML.replace(/<[^>]*>/g, ''),
        tags: ['confirmacion', 'sistema-creditos']
      };

      const response = await axios.post(`${this.baseURL}/smtp/email`, emailData, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        timeout: 30000
      });

      console.log('. Email enviado exitosamente via Brevo API');
      console.log('. ID del mensaje:', response.data.messageId);

      return {
        success: true,
        messageId: response.data.messageId,
        data: response.data
      };

    } catch (error) {
      console.error('. Error enviando email via Brevo API:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      return {
        success: false,
        error: error.response?.data || error.message,
        code: error.response?.status
      };
    }
  }
/**
 * Enviar email con archivos adjuntos - VERSIÓN CORREGIDA CON FORMATO DESTINATARIOS
 */
async enviarEmailConAdjuntos(destinatario, asunto, contenidoHTML, adjuntos = []) {
    try {
        console.log(`. [BREVO API] Enviando email con adjuntos a:`, destinatario);
        
        // CORRECCIÓN MEJORADA: Manejo flexible de formatos de destinatario
        let toFormat;
        
        if (typeof destinatario === 'string') {
            // Caso 1: String simple (formato actual)
            toFormat = [{
                email: destinatario,
                name: destinatario.split('@')[0] || 'Usuario'
            }];
            console.log('. Destinatario en formato string:', destinatario);
            
        } else if (destinatario && typeof destinatario === 'object') {
            
            if (destinatario.email) {
                // Caso 2: Objeto con propiedad email (nuevo formato)
                toFormat = [{
                    email: destinatario.email,
                    name: destinatario.name || destinatario.email.split('@')[0] || 'Usuario'
                }];
                console.log('. Destinatario en formato objeto con email:', destinatario.email);
                
            } else if (Array.isArray(destinatario)) {
                // Caso 3: Array de destinatarios
                toFormat = destinatario.map(dest => {
                    if (typeof dest === 'string') {
                        return {
                            email: dest,
                            name: dest.split('@')[0] || 'Usuario'
                        };
                    } else if (dest && dest.email) {
                        return {
                            email: dest.email,
                            name: dest.name || dest.email.split('@')[0] || 'Usuario'
                        };
                    }
                    return null;
                }).filter(Boolean);
                
                console.log('. Múltiples destinatarios:', toFormat.length);
                
            } else {
                console.error('. Error: Formato de objeto destinatario no reconocido:', destinatario);
                return {
                    success: false,
                    error: 'Formato de destinatario inválido. Se esperaba string, objeto con email, o array.'
                };
            }
            
        } else {
            console.error('. Error: Tipo de destinatario no soportado:', typeof destinatario, destinatario);
            return {
                success: false,
                error: 'Formato de destinatario inválido. Se esperaba string u objeto con propiedad email.'
            };
        }

        // Validación final del formato
        if (!toFormat || toFormat.length === 0) {
            console.error('. Error: No se pudo determinar el formato del destinatario');
            return {
                success: false,
                error: 'No se pudo procesar el formato del destinatario'
            };
        }

        console.log(`. Número de adjuntos: ${adjuntos.length}`);
        console.log('. Formato final de destinatarios:', toFormat);

        const emailData = {
            sender: {
                name: process.env.EMAIL_FROM_NAME || 'Sistema de Créditos',
                email: process.env.EMAIL_FROM_EMAIL || 'no-reply@creditos.com'
            },
            to: toFormat,
            subject: asunto,
            htmlContent: contenidoHTML,
            textContent: contenidoHTML.replace(/<[^>]*>/g, ''),
            tags: ['comprobante', 'transferencia', 'sistema-creditos'],
            attachment: adjuntos
        };

        console.log('. Datos del email con adjuntos preparados correctamente');

        const response = await axios.post(`${this.baseURL}/smtp/email`, emailData, {
            headers: {
                'api-key': this.apiKey,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            timeout: 30000
        });

        console.log('. Email con adjuntos enviado exitosamente via Brevo API');
        console.log('. ID del mensaje:', response.data.messageId);

        return {
            success: true,
            messageId: response.data.messageId,
            data: response.data
        };

    } catch (error) {
        console.error('. Error enviando email con adjuntos via Brevo API:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        return {
            success: false,
            error: error.response?.data || error.message,
            code: error.response?.status
        };
    }
}
/**
 * Método específico para enviar comprobante de transferencia
 */
async enviarEmailComprobanteTransferencia(destinatario, nombre, datosTransferencia, archivoComprobante) {
    const asunto = `Comprobante de Transferencia - ${datosTransferencia.numero_comprobante}`;
    
    const contenidoHTML = this.crearPlantillaComprobanteHTML(nombre, datosTransferencia);
    
    // Usar el nuevo método de formateo para mantener compatibilidad
    let destinatarioFormateado;
    try {
        destinatarioFormateado = this.formatearDestinatario(destinatario);
    } catch (error) {
        console.error('. Error formateando destinatario:', error.message);
        return {
            success: false,
            error: error.message
        };
    }

    // Preparar adjunto
    const adjuntos = [{
        name: `comprobante-${datosTransferencia.numero_comprobante}.pdf`,
        content: archivoComprobante.toString('base64')
    }];

    console.log('. Enviando comprobante a:', destinatarioFormateado);

    // Llamar al método principal con el destinatario ya formateado
    return await this.enviarEmailConAdjuntos(destinatarioFormateado, asunto, contenidoHTML, adjuntos);
}
// Plantillas para comprobante
crearPlantillaComprobanteHTML(nombre, datosTransferencia) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .transferencia-info { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #16a34a; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-label { font-weight: bold; color: #4b5563; }
        .info-value { color: #1f2937; }
        .monto { font-size: 24px; font-weight: bold; color: #16a34a; text-align: center; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f8fafc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Comprobante de Transferencia</h1>
            <p>Transferencia procesada exitosamente</p>
        </div>
        <div class="content">
            <p>Estimado/a <strong>${nombre}</strong>,</p>
            <p>Su transferencia ha sido procesada exitosamente. A continuación los detalles:</p>
            
            <div class="transferencia-info">
                <div class="monto">
                    ${datosTransferencia.moneda} ${datosTransferencia.monto.toLocaleString()}
                </div>
                
                <div class="info-row">
                    <span class="info-label">Número de Comprobante:</span>
                    <span class="info-value">${datosTransferencia.numero_comprobante}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Cuenta Destino:</span>
                    <span class="info-value">${datosTransferencia.cuenta_destino}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Banco Destino:</span>
                    <span class="info-value">${datosTransferencia.banco_destino}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Fecha de Procesamiento:</span>
                    <span class="info-value">${new Date(datosTransferencia.fecha_procesamiento).toLocaleString()}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Motivo:</span>
                    <span class="info-value">${datosTransferencia.motivo || 'Transferencia de crédito aprobado'}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Costo de Transferencia:</span>
                    <span class="info-value" style="color: #16a34a;">${datosTransferencia.moneda} ${datosTransferencia.costo_transferencia.toLocaleString()}</span>
                </div>
            </div>
            
            <p><strong>Este comprobante es un documento válido que acredita la transferencia realizada.</strong></p>
        </div>
        <div class="footer">
            <p>Sistema de Créditos - Nexia Bank</p>
            <p>Para consultas, contacte a su ejecutivo asignado</p>
        </div>
    </div>
</body>
</html>`;
}

crearPlantillaComprobanteTexto(nombre, datosTransferencia) {
    return `Comprobante de Transferencia - ${datosTransferencia.numero_comprobante}

Hola ${nombre},

Su transferencia ha sido procesada exitosamente.

Detalles de la transferencia:
- Monto: ${datosTransferencia.moneda} ${datosTransferencia.monto}
- Número de Comprobante: ${datosTransferencia.numero_comprobante}
- Cuenta Destino: ${datosTransferencia.cuenta_destino}
- Banco Destino: ${datosTransferencia.banco_destino}
- Fecha: ${new Date(datosTransferencia.fecha_procesamiento).toLocaleString()}
- Motivo: ${datosTransferencia.motivo || 'Transferencia de crédito aprobado'}
- Costo: ${datosTransferencia.moneda} ${datosTransferencia.costo_transferencia}

Este comprobante es un documento válido que acredita la transferencia realizada.

Sistema de Créditos - Nexia Bank`;
}
  // Método específico para email de confirmación
async enviarEmailConfirmacion(email, nombre, enlaceConfirmacion) {
  const asunto = 'Confirma tu email - Sistema de Créditos';
  
  const contenidoHTML = this.crearPlantillaConfirmacionHTML(nombre, enlaceConfirmacion);
  const contenidoTexto = this.crearPlantillaConfirmacionTexto(nombre, enlaceConfirmacion);

  return await this.enviarEmail(email, asunto, contenidoHTML, contenidoTexto, 'Sistema de Créditos');
}
/**
 * Método auxiliar para convertir destinatarios al formato correcto
 * Mantiene compatibilidad con código existente
 */
formatearDestinatario(destinatario) {
    if (typeof destinatario === 'string') {
        return [{
            email: destinatario,
            name: destinatario.split('@')[0] || 'Usuario'
        }];
    }
    
    if (destinatario && destinatario.email) {
        return [{
            email: destinatario.email,
            name: destinatario.name || destinatario.email.split('@')[0] || 'Usuario'
        }];
    }
    
    if (Array.isArray(destinatario)) {
        return destinatario.map(dest => {
            if (typeof dest === 'string') {
                return {
                    email: dest,
                    name: dest.split('@')[0] || 'Usuario'
                };
            }
            if (dest && dest.email) {
                return {
                    email: dest.email,
                    name: dest.name || dest.email.split('@')[0] || 'Usuario'
                };
            }
            return null;
        }).filter(Boolean);
    }
    
    throw new Error('Formato de destinatario no válido');
}
  // Método específico para email de bienvenida
  async enviarEmailBienvenida(email, nombre, rol) {
    const asunto = rol === 'operador' 
      ? '¡Bienvenido Operador al Sistema de Créditos!' 
      : '¡Bienvenido Solicitante al Sistema de Créditos!';
    
    const contenidoHTML = this.crearPlantillaBienvenidaHTML(nombre, rol);
    const contenidoTexto = this.crearPlantillaBienvenidaTexto(nombre, rol);

    return await this.enviarEmail(email, asunto, contenidoHTML, contenidoTexto, 'Sistema de Créditos');
  }

  // Plantillas HTML
  crearPlantillaConfirmacionHTML(nombre, enlaceConfirmacion) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f8fafc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Confirma tu Email</h1>
        </div>
        <div class="content">
            <p>Estimado/a <strong>${nombre}</strong>,</p>
            <p>¡Gracias por registrarte en el Sistema de Créditos! Para activar tu cuenta, confirma tu dirección de email.</p>
            
            <p style="text-align: center;">
                <a href="${enlaceConfirmacion}" class="button">Confirmar Mi Email</a>
            </p>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; font-size: 12px; color: #6b7280;">${enlaceConfirmacion}</p>
            
            <p><strong>Este enlace expirará en 24 horas.</strong></p>
        </div>
        <div class="footer">
            <p>Sistema de Créditos</p>
        </div>
    </div>
</body>
</html>`;
  }

  crearPlantillaBienvenidaHTML(nombre, rol) {
    const mensaje = rol === 'operador'
      ? `Hola <strong>${nombre}</strong>, bienvenido como operador del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a gestionar solicitudes.`
      : `Hola <strong>${nombre}</strong>, bienvenido como solicitante del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a solicitar créditos para tu empresa.`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f8fafc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${rol === 'operador' ? '¡Bienvenido Operador!' : '¡Bienvenido Solicitante!'}</h1>
        </div>
        <div class="content">
            <p>${mensaje}</p>
            
            <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Iniciar Sesión</a>
            </p>
        </div>
        <div class="footer">
            <p>Sistema de Créditos</p>
        </div>
    </div>
</body>
</html>`;
  }

  // Plantillas de texto
  crearPlantillaConfirmacionTexto(nombre, enlaceConfirmacion) {
    return `Confirma tu email - Sistema de Créditos

Hola ${nombre},

¡Gracias por registrarte! Para activar tu cuenta, confirma tu dirección de email haciendo clic en el siguiente enlace:

${enlaceConfirmacion}

Este enlace expirará en 24 horas.

Sistema de Créditos`;
  }

  crearPlantillaBienvenidaTexto(nombre, rol) {
    const mensaje = rol === 'operador'
      ? `Hola ${nombre}, bienvenido como operador del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a gestionar solicitudes.`
      : `Hola ${nombre}, bienvenido como solicitante del sistema de créditos. Tu cuenta ha sido creada exitosamente y ya puedes comenzar a solicitar créditos para tu empresa.`;

    return `${rol === 'operador' ? '¡Bienvenido Operador!' : '¡Bienvenido Solicitante!'}

${mensaje}

Inicia sesión en: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Sistema de Créditos`;
  }
}



// Instancia singleton
const brevoAPIService = new BrevoAPIService();

// Exportar funciones individuales para compatibilidad
module.exports = brevoAPIService;
module.exports.verificarConexionBrevo = brevoAPIService.verificarConexionBrevo.bind(brevoAPIService);