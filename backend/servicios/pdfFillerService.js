// servicios/pdfFillerService.js
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');

class PDFFillerService {
    constructor() {
        this.baseURL = process.env.PDFFILLER_BASE_URL || 'https://api.pdffiller.com/v2';
        this.apiKey = process.env.PDFFILLER_API_KEY;
        this.clientId = process.env.PDFFILLER_CLIENT_ID;
        this.clientSecret = process.env.PDFFILLER_CLIENT_SECRET;
        this.timeout = 30000; // 30 segundos
    }

    getAuthHeaders() {
        if (!this.apiKey) {
            throw new Error('PDFFILLER_API_KEY no está configurada');
        }
        
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'SistemaCreditos/1.0'
        };
    }

    /**
     * Generar hash único para el documento con metadatos
     */
    generarHashDocumento(buffer, metadatos = {}) {
        const hash = crypto.createHash('sha256');
        hash.update(buffer);
        
        // Incluir metadatos en el hash para mayor seguridad
        if (Object.keys(metadatos).length > 0) {
            hash.update(JSON.stringify(metadatos));
        }
        
        return hash.digest('hex');
    }

    /**
     * Validar integridad del documento con verificación avanzada
     */
    validarIntegridadDocumento(originalHash, firmadoHash, metadatosOriginal = {}, metadatosFirmado = {}) {
        if (!originalHash || !firmadoHash) {
            return false;
        }
        
        // Verificación básica de hash
        const hashCoincide = originalHash === firmadoHash;
        
        // Verificación adicional de metadatos críticos
        const metadatosCoinciden = 
            metadatosOriginal.tamanio === metadatosFirmado.tamanio &&
            metadatosOriginal.paginas === metadatosFirmado.paginas;
        
        return hashCoincide && metadatosCoinciden;
    }

    /**
     * Subir documento a PDFfiller con manejo de errores mejorado
     */
    async subirDocumento(nombreArchivo, buffer, metadatos = {}) {
        try {
            console.log('📄 Subiendo documento a PDFfiller:', {
                nombreArchivo,
                tamanio: buffer.length,
                metadatos
            });

            const formData = new FormData();
            formData.append('file', buffer, {
                filename: nombreArchivo,
                contentType: 'application/pdf'
            });

            // Agregar metadatos si existen
            if (Object.keys(metadatos).length > 0) {
                formData.append('metadata', JSON.stringify(metadatos));
            }

            const response = await axios.post(
                `${this.baseURL}/templates`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${this.apiKey}`,
                    },
                    timeout: this.timeout,
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );

            console.log('✅ Documento subido exitosamente:', {
                documentId: response.data.id,
                nombre: response.data.name,
                tipo: response.data.type
            });

            return {
                success: true,
                documentId: response.data.id,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Error subiendo documento a PDFfiller:', {
                error: error.response?.data || error.message,
                status: error.response?.status,
                nombreArchivo
            });

            return {
                success: false,
                error: error.response?.data || error.message,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Crear solicitud de firma para múltiples firmantes
     */
    async crearSolicitudFirmaMultiple(documentId, solicitante, operador) {
        try {
            console.log('📝 Creando solicitud de firma múltiple para documento:', documentId);

            const requestData = {
                method: "sendtogroup",
                document_id: documentId,
                envelope_name: `Contrato-Credito-${Date.now()}`,
                security_pin: "standard",
                sign_in_order: true, // Firmar en orden
                sender_notifications: true,
                recipients: [
                    {
                        role: 11, // Solicitante
                        email: solicitante.email,
                        name: solicitante.nombre_completo,
                        order: 1,
                        message_subject: "Solicitud de Firma Digital - Contrato de Crédito",
                        message_text: `Estimado/a ${solicitante.nombre_completo},

Se solicita su firma digital para el contrato de crédito aprobado.

Este es un proceso legalmente vinculante. Por favor, revise cuidadosamente el documento antes de firmar.

INSTRUCCIONES:
1. Revise el documento completo
2. Haga clic en el botón "Firmar"
3. Siga las instrucciones en pantalla
4. Confirme su firma

Tiene 7 días para completar este proceso.

Atentamente,
Equipo de Créditos`,
                        access: "full",
                        require_photo: false
                    },
                    {
                        role: 45, // Operador/Representante
                        email: operador.email,
                        name: operador.nombre_completo,
                        order: 2,
                        message_subject: "Firma Digital - Contrato de Crédito Aprobado",
                        message_text: `Estimado/a ${operador.nombre_completo},

Se requiere su firma digital como representante para el contrato de crédito aprobado.

El solicitante debe firmar primero el documento. Una vez que el solicitante haya firmado, usted recibirá una notificación para proceder con su firma.

Este documento es legalmente vinculante.

Atentamente,
Sistema de Créditos Automatizado`,
                        access: "full",
                        require_photo: false
                    }
                ]
            };

            const response = await axios.post(
                `${this.baseURL}/signature_requests`,
                requestData,
                { 
                    headers: this.getAuthHeaders(),
                    timeout: this.timeout
                }
            );

            console.log('✅ Solicitud de firma múltiple creada:', {
                signatureRequestId: response.data.signature_request_id,
                envelopeName: response.data.envelope_name,
                totalRecipients: response.data.recipients?.length
            });

            // Extraer URLs de firma para cada destinatario
            const urlsFirma = {};
            if (response.data.recipients) {
                response.data.recipients.forEach(recipient => {
                    if (recipient.order === 1) {
                        urlsFirma.solicitante = recipient.signing_url;
                    } else if (recipient.order === 2) {
                        urlsFirma.operador = recipient.signing_url;
                    }
                });
            }

            return {
                success: true,
                signatureRequestId: response.data.signature_request_id,
                envelopeId: response.data.envelope_id,
                urlsFirma: urlsFirma,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Error creando solicitud de firma múltiple:', {
                error: error.response?.data || error.message,
                documentId,
                status: error.response?.status
            });

            return {
                success: false,
                error: error.response?.data || error.message,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Crear solicitud de firma individual (fallback)
     */
    async crearSolicitudFirmaIndividual(documentId, destinatario, tipoFirmante = 'solicitante') {
        try {
            console.log('📝 Creando solicitud de firma individual:', { documentId, tipoFirmante });

            const requestData = {
                method: "sendtoeach",
                document_id: documentId,
                security_pin: "standard",
                recipients: {
                    email: destinatario.email,
                    name: destinatario.nombre_completo,
                    message_subject: tipoFirmante === 'solicitante' 
                        ? "Solicitud de Firma Digital - Contrato de Crédito"
                        : "Firma Digital Requerida - Contrato de Crédito",
                    message_text: tipoFirmante === 'solicitante'
                        ? `Estimado/a ${destinatario.nombre_completo},

Se solicita su firma digital para el contrato de crédito aprobado.

Por favor, revise el documento y proceda con la firma digital mediante el enlace proporcionado.

Este es un proceso legalmente vinculante.

Atentamente,
Equipo de Créditos`
                        : `Estimado/a ${destinatario.nombre_completo},

Se requiere su firma digital como representante para el contrato de crédito aprobado.

Por favor, proceda con la firma digital del documento.

Atentamente,
Sistema de Créditos Automatizado`,
                    access: "full",
                    require_photo: false
                }
            };

            const response = await axios.post(
                `${this.baseURL}/signature_requests`,
                requestData,
                { 
                    headers: this.getAuthHeaders(),
                    timeout: this.timeout
                }
            );

            console.log('✅ Solicitud de firma individual creada:', {
                signatureRequestId: response.data.signature_request_id,
                tipoFirmante
            });

            return {
                success: true,
                signatureRequestId: response.data.signature_request_id,
                urlFirma: response.data.recipients?.signing_url,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Error creando solicitud de firma individual:', {
                error: error.response?.data || error.message,
                documentId,
                tipoFirmante,
                status: error.response?.status
            });

            return {
                success: false,
                error: error.response?.data || error.message,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Verificar estado de la firma con información detallada
     */
    async verificarEstadoFirma(signatureRequestId) {
        try {
            console.log('🔍 Verificando estado de firma:', signatureRequestId);

            const response = await axios.get(
                `${this.baseURL}/signature_requests/${signatureRequestId}`,
                { 
                    headers: this.getAuthHeaders(),
                    timeout: this.timeout
                }
            );

            const data = response.data;
            const estado = data.status?.toLowerCase() || 'unknown';
            
            console.log('📊 Estado detallado de firma:', {
                signatureRequestId,
                estado,
                totalRecipients: data.recipients?.length,
                recipients: data.recipients?.map(r => ({
                    nombre: r.name,
                    email: r.email,
                    estado: r.status,
                    orden: r.order,
                    fechaFirma: r.date_signed
                }))
            });

            return {
                success: true,
                estado: estado,
                estadoDetallado: data,
                recipients: data.recipients || [],
                data: data
            };
        } catch (error) {
            console.error('❌ Error verificando estado de firma:', {
                error: error.response?.data || error.message,
                signatureRequestId,
                status: error.response?.status
            });

            return {
                success: false,
                error: error.response?.data || error.message,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Descargar documento firmado con verificación de hash
     */
    async descargarDocumentoFirmado(signatureRequestId) {
        try {
            console.log('📥 Descargando documento firmado:', signatureRequestId);

            const response = await axios.get(
                `${this.baseURL}/signature_requests/${signatureRequestId}/signed_document`,
                {
                    headers: this.getAuthHeaders(),
                    responseType: 'arraybuffer',
                    timeout: this.timeout
                }
            );

            const buffer = Buffer.from(response.data);
            
            console.log('✅ Documento firmado descargado:', {
                signatureRequestId,
                tamanio: buffer.length,
                hash: this.generarHashDocumento(buffer)
            });

            return {
                success: true,
                buffer: buffer,
                hash: this.generarHashDocumento(buffer),
                tamanio: buffer.length,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Error descargando documento firmado:', {
                error: error.response?.data || error.message,
                signatureRequestId,
                status: error.response?.status
            });

            return {
                success: false,
                error: error.response?.data || error.message,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Obtener certificado de firma con información legal
     */
    async obtenerCertificadoFirma(signatureRequestId) {
        try {
            console.log('📜 Obteniendo certificado de firma:', signatureRequestId);

            const response = await axios.get(
                `${this.baseURL}/signature_requests/${signatureRequestId}/certificate`,
                { 
                    headers: this.getAuthHeaders(),
                    timeout: this.timeout
                }
            );

            const certificado = response.data;
            
            console.log('✅ Certificado de firma obtenido:', {
                signatureRequestId,
                tieneCertificado: !!certificado,
                timestamp: certificado?.created
            });

            return {
                success: true,
                certificado: certificado,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Error obteniendo certificado:', {
                error: error.response?.data || error.message,
                signatureRequestId,
                status: error.response?.status
            });

            return {
                success: false,
                error: error.response?.data || error.message,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Verificar la validez legal de una firma
     */
    async verificarValidezLegal(signatureRequestId) {
        try {
            console.log('⚖️ Verificando validez legal de firma:', signatureRequestId);

            // Obtener estado detallado
            const estadoResult = await this.verificarEstadoFirma(signatureRequestId);
            if (!estadoResult.success) {
                throw new Error('No se pudo verificar el estado de la firma');
            }

            // Obtener certificado
            const certificadoResult = await this.obtenerCertificadoFirma(signatureRequestId);
            
            const estado = estadoResult.estado;
            const certificado = certificadoResult.certificado;
            const recipients = estadoResult.recipients;

            // Validaciones legales
            const validaciones = {
                firmaCompleta: estado === 'completed' || estado === 'done',
                todosFirmaron: recipients.every(r => r.status?.toLowerCase() === 'signed'),
                certificadoPresente: !!certificado,
                timestampsValidos: this.validarTimestamps(certificado),
                firmantesIdentificados: this.validarIdentidadFirmantes(recipients)
            };

            const valido = Object.values(validaciones).every(v => v === true);

            console.log('📋 Resultado validación legal:', {
                signatureRequestId,
                valido,
                validaciones
            });

            return {
                success: true,
                valido: valido,
                validaciones: validaciones,
                estado: estado,
                certificado: certificado,
                recipients: recipients
            };
        } catch (error) {
            console.error('❌ Error verificando validez legal:', error);
            return {
                success: false,
                error: error.message,
                valido: false
            };
        }
    }

    /**
     * Validar timestamps del certificado
     */
    validarTimestamps(certificado) {
        if (!certificado) return false;
        
        const now = Date.now() / 1000;
        const created = certificado.created;
        
        // Verificar que el certificado no sea del futuro y tenga menos de 1 año
        return created <= now && created > (now - 365 * 24 * 60 * 60);
    }

    /**
     * Validar identidad de los firmantes
     */
    validarIdentidadFirmantes(recipients) {
        if (!recipients || recipients.length === 0) return false;
        
        return recipients.every(recipient => 
            recipient.email && 
            recipient.name && 
            recipient.status?.toLowerCase() === 'signed'
        );
    }

    /**
     * Procesar webhook de PDFfiller con seguridad
     */
    async procesarWebhook(webhookData, signatureHeader) {
        try {
            console.log('🔄 Procesando webhook de PDFfiller:', webhookData.event_type);

            // Verificar firma del webhook (si está configurado)
            if (this.webhookSecret && signatureHeader) {
                const esValido = this.verificarFirmaWebhook(signatureHeader, webhookData);
                if (!esValido) {
                    throw new Error('Firma de webhook inválida');
                }
            }

            const { event_type, signature_request_id, data } = webhookData;

            // Registrar en auditoría
            await this.registrarEventoWebhook(signature_request_id, event_type, webhookData);

            // Determinar nuevo estado según el evento
            let nuevoEstado = this.mapearEstadoWebhook(event_type, data);

            console.log('📨 Webhook procesado:', {
                event_type,
                signature_request_id,
                nuevoEstado,
                data: data || 'No data'
            });

            return {
                success: true,
                signatureRequestId: signature_request_id,
                eventType: event_type,
                nuevoEstado: nuevoEstado,
                data: webhookData
            };
        } catch (error) {
            console.error('❌ Error procesando webhook:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mapear evento de webhook a estado interno
     */
    mapearEstadoWebhook(eventType, eventData) {
        const mapeoEstados = {
            'signature_request.sent': 'enviado',
            'signature_request.viewed': 'enviado',
            'signature_request.signed': 'firmado_solicitante',
            'signature_request.declined': 'rechazado',
            'signature_request.completed': 'firmado_completo',
            'signature_request.expired': 'expirado',
            'signature_request.error': 'error'
        };

        // Manejo especial para firmas múltiples
        if (eventType === 'signature_request.signed' && eventData) {
            const recipient = eventData.recipient;
            if (recipient && recipient.order === 2) {
                return 'firmado_operador';
            }
        }

        return mapeoEstados[eventType] || 'pendiente';
    }

    /**
     * Verificar firma del webhook
     */
    verificarFirmaWebhook(signatureHeader, payload) {
        try {
            const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
            const expectedSignature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(payloadString)
                .digest('hex');
            
            return signatureHeader === expectedSignature;
        } catch (error) {
            console.error('Error verificando firma webhook:', error);
            return false;
        }
    }

    /**
     * Registrar evento de webhook en auditoría
     */
    async registrarEventoWebhook(signatureRequestId, eventType, eventData) {
        try {
            const { supabase } = require('../config/conexion');

            // Buscar la firma por signature_request_id
            const { data: firma } = await supabase
                .from('firmas_digitales')
                .select('id')
                .eq('signature_request_id', signatureRequestId)
                .single();

            if (firma) {
                await supabase
                    .from('auditoria_firmas')
                    .insert({
                        firma_id: firma.id,
                        accion: 'webhook_' + eventType,
                        descripcion: `Evento de webhook recibido: ${eventType}`,
                        signature_request_id: signatureRequestId,
                        event_type: eventType,
                        event_data: eventData,
                        ip_address: eventData.ip_address,
                        user_agent: eventData.user_agent,
                        created_at: new Date().toISOString()
                    });

                console.log('📝 Evento webhook registrado en auditoría:', {
                    firmaId: firma.id,
                    eventType,
                    signatureRequestId
                });
            } else {
                console.warn('⚠️ No se encontró firma para webhook:', signatureRequestId);
            }
        } catch (error) {
            console.error('❌ Error registrando evento webhook:', error);
        }
    }

    /**
     * Reenviar solicitud de firma expirada
     */
    async reenviarSolicitudFirma(signatureRequestId) {
        try {
            console.log('🔄 Reenviando solicitud de firma:', signatureRequestId);

            const response = await axios.post(
                `${this.baseURL}/signature_requests/${signatureRequestId}`,
                {}, // Body vacío para reenvío
                { 
                    headers: this.getAuthHeaders(),
                    timeout: this.timeout
                }
            );

            console.log('✅ Solicitud de firma reenviada:', {
                signatureRequestId,
                nuevoRequestId: response.data.signature_request_id
            });

            return {
                success: true,
                nuevoSignatureRequestId: response.data.signature_request_id,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Error reenviando solicitud de firma:', {
                error: error.response?.data || error.message,
                signatureRequestId,
                status: error.response?.status
            });

            return {
                success: false,
                error: error.response?.data || error.message,
                statusCode: error.response?.status
            };
        }
    }
}

module.exports = new PDFFillerService();