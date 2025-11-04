// controladores/FirmaDigitalController.js
const crypto = require('crypto');
const FirmaDigitalModel = require('../modelos/FirmaDigitalModel');
const NotificacionesController = require('./NotificacionesController');
const NotificacionService = require('../servicios/NotificacionService');
const WordService = require('../servicios/WordService');
const ContratoController = require('./ContratoController');
const { supabase } = require('../config/conexion');

class FirmaDigitalController {

    /**
     * Generar hash único para documento
     */
    static generarHashDocumento(buffer, metadatos = {}) {
        const contenido = buffer.toString('base64') + JSON.stringify(metadatos);
        return crypto.createHash('sha256').update(contenido).digest('hex');
    }
 /**
 * Descargar documento firmado - . .
 */
static async descargarDocumentoFirmado(req, res) {
    try {
        const { firma_id } = req.params;
        const usuario = req.usuario;

        console.log('. Descargando documento firmado para firma:', firma_id);

        // Obtener información completa de la firma
        const { data: firma, error } = await supabase
            .from('firmas_digitales')
            .select(`
                id,
                estado,
                url_documento_firmado,
                ruta_documento,
                hash_documento_firmado,
                fecha_firma_completa,
                solicitud_id,
                contrato_id,
                contratos (
                    id,
                    estado,
                    ruta_documento,
                    numero_contrato
                )
            `)
            .eq('id', firma_id)
            .single();

        if (error || !firma) {
            console.error('. Error obteniendo firma:', error);
            return res.status(404).json({
                success: false,
                message: 'Proceso de firma no encontrado'
            });
        }

        console.log('. Estado de la firma:', firma.estado);
        console.log('. URL documento firmado:', firma.url_documento_firmado);

        // NUEVA LÓGICA: Si el estado es firmado, DEBE existir documento firmado
        if (firma.estado.includes('firmado')) {
            if (!firma.url_documento_firmado) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento firmado no disponible para esta firma'
                });
            }
            
            // USAR EXCLUSIVAMENTE el documento firmado
            const rutaDescarga = firma.url_documento_firmado;
            const nombreArchivo = `contrato-firmado-${firma.contratos?.numero_contrato || firma_id}.docx`;

            console.log('. Descargando documento firmado desde:', rutaDescarga);

            // Descargar archivo
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('kyc-documents')
                .download(rutaDescarga);

            if (downloadError) {
                console.error('. Error descargando archivo:', downloadError);
                return res.status(404).json({
                    success: false,
                    message: 'Error al acceder al archivo firmado: ' + downloadError.message
                });
            }

            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Cache-Control', 'no-cache');

            console.log('. Documento FIRMADO descargado exitosamente:', nombreArchivo);
            res.send(buffer);

        } else {
            // Solo para estados no firmados, permitir documento original
            return res.status(400).json({
                success: false,
                message: 'El contrato no ha sido firmado completamente'
            });
        }

    } catch (error) {
        console.error('. Error descargando documento firmado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al descargar documento: ' + error.message
        });
    }
}
 static async verificarEstadoFirma(signatureRequestId) { 
        try { 
            console.log('. Verificando estado de firma:', 
signatureRequestId); 
 
            const response = await this.executeRequest( 
                'get', 
                `/signature_requests/${signatureRequestId}` 
            ); 
 
356 
 
            const data = response.data; 
            const estado = data.status?.toLowerCase() || 'unknown'; 
             
            console.log('. Estado de firma:', {  
                signatureRequestId,  
                estado, 
                completado: estado === 'completed' 
            }); 
 
            return { 
                success: true, 
                estado: estado, 
                completado: estado === 'completed', 
                estadoDetallado: data, 
                recipients: data.recipients || [], 
                data: data 
            }; 
 
        } catch (error) { 
            console.error('. Error verificando estado de firma:', { 
                error: error.response?.data || error.message, 
                signatureRequestId 
            }); 
 
            return { 
                success: false, 
                error: error.response?.data || error.message, 
                statusCode: error.response?.status 
            }; 
        } 
    } 
    static async descargarContratoFirmadoEspecifico(req, res) {
    try {
        const { firma_id } = req.params;
        const usuario = req.usuario;

        console.log('. Descargando CONTRATO FIRMADO específico para:', firma_id);

        // Obtener información completa de la firma
        const { data: firma, error } = await supabase
            .from('firmas_digitales')
            .select(`
                id,
                estado,
                url_documento_firmado,
                ruta_documento,
                fecha_firma_completa,
                integridad_valida,
                contrato_id,
                solicitud_id,
                contratos (
                    numero_contrato,
                    estado as contrato_estado,
                    ruta_documento as contrato_ruta_documento
                )
            `)
            .eq('id', firma_id)
            .single();

        if (error || !firma) {
            return res.status(404).json({
                success: false,
                message: 'Proceso de firma no encontrado'
            });
        }

        console.log('. Estado de la firma:', firma.estado);
        console.log('. URL documento firmado:', firma.url_documento_firmado);

        // VERIFICACIÓN CRÍTICA: Solo permitir descarga si está completamente firmado
        if (firma.estado !== 'firmado_completo' && firma.estado !== 'firmado_solicitante') {
            return res.status(400).json({
                success: false,
                message: 'El contrato no está completamente firmado. Estado actual: ' + firma.estado
            });
        }

        // PRIORIDAD ABSOLUTA: Usar SIEMPRE el documento firmado si existe
        let rutaDescarga = null;
        let nombreArchivo = `contrato-firmado-${firma.contratos?.numero_contrato || firma_id}`;

        if (firma.url_documento_firmado) {
            rutaDescarga = firma.url_documento_firmado;
            nombreArchivo += '.docx';
            console.log('. Usando documento firmado específico:', rutaDescarga);
        } else {
            // Si no hay documento firmado específico, no permitir descarga
            return res.status(404).json({
                success: false,
                message: 'No hay documento firmado disponible para descargar. El contrato puede estar en proceso de firma.'
            });
        }

        console.log('. Descargando contrato firmado desde:', rutaDescarga);

        // Descargar archivo
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('kyc-documents')
            .download(rutaDescarga);

        if (downloadError) {
            console.error('. Error descargando archivo firmado:', downloadError);
            return res.status(404).json({
                success: false,
                message: 'Error accediendo al documento firmado: ' + downloadError.message
            });
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache');

        console.log('. CONTRATO FIRMADO descargado exitosamente:', nombreArchivo);
        res.send(buffer);

    } catch (error) {
        console.error('. Error descargando contrato firmado específico:', error);
        res.status(500).json({
            success: false,
            message: 'Error al descargar el contrato firmado: ' + error.message
        });
    }
}
     /** 
     * Reenviar solicitud de firma expirada 
     */ 
    static async reenviarSolicitudFirma(req, res) { 
        try { 
            const { firma_id } = req.params; 
            const operador_id = req.usuario.id; 
 
            console.log('. Reenviando solicitud de firma:', firma_id); 
 
            // Verificar que la firma existe y está expirada 
            const { data: firma, error: firmaError } = await supabase 
                .from('firmas_digitales') 
                .select('*') 
                .eq('id', firma_id) 
                .eq('estado', 'expirado') 
                .single(); 
119 
 
 
            if (firmaError || !firma) { 
                return res.status(404).json({ 
                    success: false, 
                    message: 'Firma no encontrada o no está expirada' 
                }); 
            } 
 
            const reenvioResult = await 
FirmaDigitalController.reenviarSolicitudFirma(firma.signature_request_id); 
 
            if (!reenvioResult.success) { 
                throw new Error('Error reenviando solicitud: ' + 
reenvioResult.error); 
            } 
 
            // Actualizar en base de datos 
            const updateData = { 
                estado: 'enviado', 
                signature_request_id: 
reenvioResult.nuevoSignatureRequestId || firma.signature_request_id, 
                fecha_envio: new Date().toISOString(), 
                fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 
* 1000).toISOString(), 
                intentos_envio: firma.intentos_envio + 1, 
                ultimo_error: null, 
                updated_at: new Date().toISOString() 
            }; 
 
            const { error: updateError } = await supabase 
                .from('firmas_digitales') 
                .update(updateData) 
                .eq('id', firma_id); 
 
            if (updateError) { 
                throw updateError; 
            } 
 
            // Registrar auditoría 
            await supabase 
                .from('auditoria_firmas') 
                .insert({ 
                    firma_id: firma_id, 
                    usuario_id: operador_id, 
                    accion: 'reenvio_solicitud_firma', 
                    descripcion: 'Solicitud de firma reenviada por operador después de expiración', 
                    estado_anterior: 'expirado', 
                    estado_nuevo: 'enviado', 
                    signature_request_id: 
updateData.signature_request_id, 
                    ip_address: req.ip, 
                    user_agent: req.get('User-Agent'), 
                    created_at: new Date().toISOString() 
                }); 
 
            // Notificar al solicitante 
            await 
NotificacionesController.notificarReenvioFirma(firma.solicitud_id); 
 
            console.log('. Solicitud de firma reenviada exitosamente:', 
firma_id); 
 
            res.json({ 
                success: true, 
                message: 'Solicitud de firma reenviada exitosamente', 
                data: { 
                    firma_id: firma_id, 
                    nuevo_estado: 'enviado', 
                    fecha_expiracion: updateData.fecha_expiracion 
                } 
            }); 
 
        } catch (error) { 
            console.error('. Error reenviando solicitud de firma:', 
error); 
            res.status(500).json({ 
                success: false, 
                message: 'Error reenviando solicitud de firma: ' + 
error.message 
            }); 
        } 
    } 
    
/**
 * Reiniciar proceso de firma existente
 */
static async reiniciarProcesoFirma(req, res) {
    try {
        const { solicitud_id } = req.params;
        const { forzar_reinicio } = req.body;

        console.log('. Reiniciando proceso de firma para:', solicitud_id);

        // Buscar firma existente
        const { data: firmaExistente } = await supabase
            .from('firmas_digitales')
            .select('*')
            .eq('solicitud_id', solicitud_id)
            .in('estado', ['pendiente', 'enviado', 'firmado_solicitante', 'firmado_operador'])
            .single();

        if (firmaExistente) {
            // Marcar como expirado para permitir nuevo proceso
            await supabase
                .from('firmas_digitales')
                .update({
                    estado: 'expirado',
                    updated_at: new Date().toISOString()
                })
                .eq('id', firmaExistente.id);

            console.log('. Proceso de firma anterior marcado como expirado:', firmaExistente.id);
        }

        res.json({
            success: true,
            message: 'Proceso reiniciado exitosamente',
            data: {
                firma_anterior: firmaExistente
            }
        });

    } catch (error) {
        console.error('. Error reiniciando proceso de firma:', error);
        res.status(500).json({
            success: false,
            message: 'Error reiniciando proceso de firma'
        });
    }
}
  /**
     * Obtener información del documento actual para firma
     */
    static async obtenerDocumentoActual(req, res) {
        try {
            const { firma_id } = req.params;

            console.log('. Obteniendo documento actual para firma:', firma_id);

            const documentoResult = await WordService.obtenerUltimoDocumento(firma_id);

            if (!documentoResult.success) {
                return res.status(404).json({
                    success: false,
                    message: documentoResult.error
                });
            }

            const documentoBase64 = documentoResult.buffer.toString('base64');

            res.json({
                success: true,
                data: {
                    documento: documentoBase64,
                    es_documento_firmado: documentoResult.esDocumentoFirmado,
                    hash_actual: documentoResult.hashActual,
                    ruta_actual: documentoResult.ruta
                }
            });

        } catch (error) {
            console.error('. Error obteniendo documento actual:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo documento actual: ' + error.message
            });
        }
    }

    /**
     * Validar integridad del documento
     */
    static validarIntegridadDocumento(hashOriginal, hashFirmado) {
        return hashOriginal === hashFirmado;
    }

    /**
     * Iniciar proceso de firma digital automático
     */
    static async iniciarProcesoFirmaAutomatico(solicitud_id, usuario, ip = null) {
        try {
            console.log('. Iniciando proceso de firma digital automático para solicitud:', solicitud_id);

            // Verificar que existe contrato con ruta_documento
            const { data: contrato, error: contratoError } = await supabase
                .from('contratos')
                .select('*')
                .eq('solicitud_id', solicitud_id)
                .not('ruta_documento', 'is', null)
                .single();

            if (contratoError || !contrato) {
                throw new Error('Contrato no encontrado o sin Word generado');
            }

            // Verificar que el Word existe en storage
            const { data: fileExists, error: fileError } = await supabase.storage
                .from('kyc-documents')
                .download(contrato.ruta_documento);

            if (fileError) {
                throw new Error('Word del contrato no encontrado en storage: ' + fileError.message);
            }

            // Obtener información completa de la solicitud
            const { data: solicitud, error: solError } = await supabase
                .from('solicitudes_credito')
                .select(`
                    *,
                    solicitantes: solicitantes!solicitante_id(
                        usuarios(*)
                    ),
                    operadores: operadores!operador_id(
                        usuarios(*)
                    )
                `)
                .eq('id', solicitud_id)
                .single();

            if (solError || !solicitud) {
                throw new Error('Solicitud no encontrada');
            }

            const solicitante = solicitud.solicitantes.usuarios;
            const operador = solicitud.operadores?.usuarios || usuario;

            // Verificar si ya existe un proceso de firma activo usando el modelo
            const firmaExistente = await FirmaDigitalModel.verificarFirmaActiva(solicitud_id);

            if (firmaExistente) {
                console.log('. Ya existe proceso de firma:', firmaExistente);
                
                // Si la firma existe pero está expirada, permitir reiniciar
                if (firmaExistente.fecha_expiracion && new Date(firmaExistente.fecha_expiracion) < new Date()) {
                    console.log('. Proceso de firma expirado, permitiendo reinicio...');
                    
                    // Marcar como expirado usando el modelo
                    await FirmaDigitalModel.actualizar(firmaExistente.id, { 
                        estado: 'expirado',
                        updated_at: new Date().toISOString()
                    });
                } else {
                    // Si no está expirado, verificar si podemos permitir reinicio
                    const puedeReiniciar = await FirmaDigitalModel.verificarPuedeReiniciar(firmaExistente.id);
                    
                    if (!puedeReiniciar) {
                        return {
                            success: false,
                            message: 'Ya existe un proceso de firma en curso para esta solicitud',
                            data: {
                                firma_existente: firmaExistente,
                                puede_reintentar: false
                            }
                        };
                    }
                    
                    console.log('. Permitiendo reinicio del proceso de firma existente');
                }
            }

            // Procesar el buffer del documento
            const buffer = Buffer.from(await fileExists.arrayBuffer());

            // Generar hash del documento original con metadatos
            const metadatosDocumento = {
                solicitud_id: solicitud_id,
                contrato_id: contrato.id,
                numero_solicitud: solicitud.numero_solicitud,
                fecha_generacion: contrato.created_at,
                tamanio: buffer.length,
                paginas: await FirmaDigitalController.obtenerNumeroPaginasWord(buffer)
            };

            const hashOriginal = FirmaDigitalController.generarHashDocumento(buffer, metadatosDocumento);

            // Subir documento para firma
            const uploadResult = await WordService.subirDocumento(
                `contrato-${solicitud.numero_solicitud}-${Date.now()}.docx`,
                buffer,
                metadatosDocumento
            );

            if (!uploadResult.success) {
                throw new Error('Error subiendo documento: ' + uploadResult.error);
            }

            // Crear solicitud de firma múltiple
            const firmaResult = await FirmaDigitalController.crearSolicitudFirmaMultiple(
                contrato.id,
                solicitante,
                operador
            );

            if (!firmaResult.success) {
                // Fallback: intentar firma individual para solicitante
                console.log('. Fallback a firma individual para solicitante');
                const firmaIndividualResult = await FirmaDigitalController.crearSolicitudFirmaIndividual(
                    contrato.id,
                    solicitante,
                    'solicitante'
                );

                if (!firmaIndividualResult.success) {
                    throw new Error('Error creando solicitud de firma: ' + firmaIndividualResult.error);
                }

                firmaResult.signatureRequestId = firmaIndividualResult.signatureRequestId;
                firmaResult.urlsFirma = { solicitante: firmaIndividualResult.urlFirma };
            }

            // Registrar en base de datos usando el modelo
            const firmaData = {
                contrato_id: contrato.id,
                solicitud_id: solicitud_id,
                signature_request_id: firmaResult.signatureRequestId,
                ruta_documento: uploadResult.ruta,
                hash_documento_original: hashOriginal,
                estado: 'enviado',
                url_firma_solicitante: firmaResult.urlsFirma?.solicitante,
                url_firma_operador: firmaResult.urlsFirma?.operador,
                fecha_envio: new Date().toISOString(),
                fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                intentos_envio: 1,
                created_at: new Date().toISOString()
            };

            const firma = await FirmaDigitalModel.crear(firmaData);

            // Actualizar contrato con referencia a la firma digital
            await supabase
                .from('contratos')
                .update({
                    estado: 'pendiente_firma',
                    firma_digital_id: firma.id,
                    hash_contrato: hashOriginal,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contrato.id);

            // Registrar auditoría usando el modelo
            await FirmaDigitalModel.registrarAuditoria({
                firma_id: firma.id,
                usuario_id: usuario.id,
                accion: 'iniciar_proceso_firma_automatico',
                descripcion: 'Proceso de firma digital iniciado automáticamente al aprobar solicitud',
                estado_anterior: 'pendiente',
                estado_nuevo: 'enviado',
                signature_request_id: firmaResult.signatureRequestId,
                ip_address: ip,
                user_agent: 'Sistema Automático',
                created_at: new Date().toISOString()
            });

            // Crear notificaciones
            await NotificacionesController.crearNotificacionesFirma(
                solicitante.id, 
                operador.id, 
                solicitud_id, 
                firma
            );

            console.log('. Proceso de firma digital automático iniciado exitosamente:', firma.id);

            return {
                success: true,
                firma: firma,
                urls_firma: firmaResult.urlsFirma
            };

        } catch (error) {
            console.error('. Error en proceso de firma digital automático:', error);
            await NotificacionService.notificarErrorFirmaDigital(usuario.id, solicitud_id, error);
            throw error;
        }
    }

    /**
     * Iniciar proceso de firma manual
     */
    static async iniciarProcesoFirma(req, res) {
    try {
        const { solicitud_id } = req.params;
        const usuario = req.usuario;
        const { forzar_reinicio } = req.body;

        console.log('. Iniciando proceso de firma para solicitud:', solicitud_id);

        // 1. Verificar que la solicitud existe y está aprobada
        const { data: solicitud, error: solError } = await supabase
            .from('solicitudes_credito')
            .select(`
                *,
                solicitantes:solicitantes!solicitante_id(
                    usuarios(*),
                    nombre_empresa,
                    cuit,
                    representante_legal,
                    domicilio
                ),
                operadores:operadores!operador_id(
                    usuarios(*)
                )
            `)
            .eq('id', solicitud_id)
            .eq('estado', 'aprobado')
            .single();

        if (solError || !solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada o no aprobada'
            });
        }

        // 2. VERIFICAR Y ACTUALIZAR CONTRATO EXISTENTE - CORRECCIÓN CRÍTICA
       let contratoFinal;
let contratoExistente;

try {
    contratoExistente = await ContratoModel.obtenerPorSolicitud(solicitud_id);
} catch (error) {
    console.log('. Error verificando contrato existente, asumiendo que no existe:', error.message);
    contratoExistente = null;
}

if (!contratoExistente) {
    console.log('. No existe contrato, generando uno nuevo...');
    
    try {
        const nuevoContrato = await ContratoController.generarContratoParaSolicitud(solicitud_id);
        if (!nuevoContrato) {
            throw new Error('No se pudo generar el contrato automáticamente');
        }
        
        // Reconsultar el contrato generado
        const { data: contratoGenerado, error: errorContratoGen } = await supabase
            .from('contratos')
            .select('*')
            .eq('solicitud_id', solicitud_id)
            .single();

        if (errorContratoGen || !contratoGenerado) {
            throw new Error('No se pudo obtener el contrato generado');
        }
        
        contratoFinal = contratoGenerado;
        console.log('. . Contrato generado exitosamente:', contratoFinal.id);
        
    } catch (error) {
        console.error('. . Error generando contrato:', error);
        return res.status(400).json({
            success: false,
            message: 'Error generando contrato: ' + error.message
        });
    }
} else {
    // CONTRATO EXISTENTE - ACTUALIZARLO EN LUGAR DE CREAR UNO NUEVO
    console.log('. . Contrato existente encontrado, actualizando:', contratoExistente.id);
    
    try {
        // Actualizar el contrato existente con nueva información
        const { data: contratoActualizado, error: updateError } = await supabase
            .from('contratos')
            .update({
                estado: 'generado',
                updated_at: new Date().toISOString(),
                // Agregar cualquier otro campo que necesite actualización
                monto_aprobado: solicitud.monto,
                plazo_meses: solicitud.plazo_meses
            })
            .eq('id', contratoExistente.id)
            .select()
            .single();

        if (updateError) {
            throw new Error('Error actualizando contrato existente: ' + updateError.message);
        }
        
        contratoFinal = contratoActualizado;
        console.log('. . Contrato existente actualizado:', contratoFinal.id);
        
    } catch (error) {
        console.error('. . Error actualizando contrato existente:', error);
        return res.status(400).json({
            success: false,
            message: 'Error actualizando contrato existente: ' + error.message
        });
    }
}

        // 3. Verificar que el contrato tiene documento
        if (!contratoFinal.ruta_documento) {
            console.log('. . Contrato sin documento, generando Word...');
            try {
                await ContratoController.generarWordContrato(contratoFinal.id, solicitud);
                console.log('. . Word del contrato generado');
                
                const { data: contratoActualizado, error: errorActualizado } = await supabase
                    .from('contratos')
                    .select('*')
                    .eq('id', contratoFinal.id)
                    .single();

                if (errorActualizado || !contratoActualizado?.ruta_documento) {
                    throw new Error('No se pudo generar el documento Word');
                }
                
                contratoFinal = contratoActualizado;
                
            } catch (error) {
                console.error('. . Error generando Word:', error);
                return res.status(400).json({
                    success: false,
                    message: 'Error generando documento del contrato: ' + error.message
                });
            }
        }

        // 4. Verificar que el documento existe en storage
        console.log('. Verificando documento en storage:', contratoFinal.ruta_documento);
        const { data: fileData, error: fileError } = await supabase.storage
            .from('kyc-documents')
            .download(contratoFinal.ruta_documento);

        if (fileError) {
            console.error('. . Documento no encontrado en storage:', fileError);
            
            try {
                console.log('. . Regenerando documento...');
                await ContratoController.generarWordContrato(contratoFinal.id, solicitud);
                
                const { data: fileDataRetry, error: fileErrorRetry } = await supabase.storage
                    .from('kyc-documents')
                    .download(contratoFinal.ruta_documento);

                if (fileErrorRetry) {
                    throw new Error('No se pudo regenerar el documento: ' + fileErrorRetry.message);
                }
                
                console.log('. . Documento regenerado exitosamente');
            } catch (regenerateError) {
                console.error('. . Error regenerando documento:', regenerateError);
                return res.status(400).json({
                    success: false,
                    message: 'El documento del contrato no está disponible: ' + regenerateError.message
                });
            }
        }

        console.log('. . Documento verificado exitosamente');

        // 5. Verificar si ya existe proceso de firma usando el modelo
        const firmaExistente = await FirmaDigitalModel.verificarFirmaActiva(solicitud_id);

        if (firmaExistente) {
            console.log('. Ya existe proceso de firma:', firmaExistente);
            
            // SIEMPRE PERMITIR REEMPLAZAR LA FIRMA EXISTENTE - CORRECCIÓN CRÍTICA
            console.log('. . Reemplazando firma existente con nueva firma...');
            
            // Marcar firma existente como reemplazada
            await FirmaDigitalModel.actualizar(firmaExistente.id, { 
                estado: 'reemplazado',
                updated_at: new Date().toISOString()
            });

            console.log('. . Firma anterior marcada como reemplazada:', firmaExistente.id);
        }

        // 6. Procesar el documento para firma
        const buffer = Buffer.from(await fileData.arrayBuffer());
        
        const metadatosDocumento = {
            solicitud_id: solicitud_id,
            contrato_id: contratoFinal.id,
            numero_solicitud: solicitud.numero_solicitud,
            fecha_generacion: contratoFinal.created_at,
            tamanio: buffer.length,
            paginas: await FirmaDigitalController.obtenerNumeroPaginasWord(buffer)
        };

        const hashOriginal = FirmaDigitalController.generarHashDocumento(buffer, metadatosDocumento);

        // Subir documento para firma
        const uploadResult = await WordService.subirDocumento(
            `contrato-${solicitud.numero_solicitud}-${Date.now()}.docx`,
            buffer,
            metadatosDocumento
        );

        if (!uploadResult.success) {
            throw new Error('Error subiendo documento: ' + uploadResult.error);
        }

        // 7. Crear solicitud de firma múltiple
        const solicitante = solicitud.solicitantes?.usuarios;
        const operador = solicitud.operadores?.usuarios || usuario;

        const firmaResult = await FirmaDigitalController.crearSolicitudFirmaMultiple(
            contratoFinal.id,
            solicitante,
            operador
        );

        if (!firmaResult.success) {
            console.log('. Fallback a firma individual para solicitante');
            const firmaIndividualResult = await FirmaDigitalController.crearSolicitudFirmaIndividual(
                contratoFinal.id,
                solicitante,
                'solicitante'
            );

            if (!firmaIndividualResult.success) {
                throw new Error('Error creando solicitud de firma: ' + firmaIndividualResult.error);
            }

            firmaResult.signatureRequestId = firmaIndividualResult.signatureRequestId;
            firmaResult.urlsFirma = { solicitante: firmaIndividualResult.urlFirma };
        }

        // 8. Registrar en base de datos usando el modelo
        const firmaData = {
            contrato_id: contratoFinal.id,
            solicitud_id: solicitud_id,
            signature_request_id: firmaResult.signatureRequestId,
            ruta_documento: uploadResult.ruta,
            hash_documento_original: hashOriginal,
            estado: 'enviado',
            url_firma_solicitante: firmaResult.urlsFirma?.solicitante,
            url_firma_operador: firmaResult.urlsFirma?.operador,
            fecha_envio: new Date().toISOString(),
            fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            intentos_envio: 1,
            created_at: new Date().toISOString()
        };

        const firma = await FirmaDigitalModel.crear(firmaData);

        // 9. Actualizar contrato
        await supabase
            .from('contratos')
            .update({
                estado: 'pendiente_firma',
                firma_digital_id: firma.id,
                hash_contrato: hashOriginal,
                updated_at: new Date().toISOString()
            })
            .eq('id', contratoFinal.id);

        // 10. Registrar auditoría usando el modelo
        await FirmaDigitalModel.registrarAuditoria({
            firma_id: firma.id,
            usuario_id: usuario.id,
            accion: 'iniciar_proceso_firma',
            descripcion: 'Proceso de firma digital iniciado con verificaciones .s',
            estado_anterior: 'pendiente',
            estado_nuevo: 'enviado',
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            created_at: new Date().toISOString()
        });

        // 11. Crear notificaciones
        await NotificacionesController.crearNotificacionesFirma(
            solicitante.id, 
            operador.id, 
            solicitud_id, 
            firma
        );

        console.log('. . Proceso de firma digital iniciado exitosamente:', firma.id);

        res.json({
            success: true,
            message: 'Proceso de firma digital iniciado exitosamente',
            data: {
                firma: firma,
                urls_firma: firmaResult.urlsFirma,
                fecha_expiracion: firmaData.fecha_expiracion,
                contrato_actualizado: contratoFinal.id,
                firma_anterior_reemplazada: firmaExistente?.id || null
            }
        });

    } catch (error) {
        console.error('. . Error crítico en iniciarProcesoFirma:', error);
        res.status(500).json({
            success: false,
            message: 'Error crítico iniciando proceso de firma: ' + error.message
        });
    }
}

    /**
     * Obtener información para página de firma
     */
    static async obtenerInfoFirma(req, res) {
        try {
            const { firma_id } = req.params;
            const usuario_id = req.usuario.id;

            console.log('. Obteniendo información para firma Word:', firma_id);

            // Verificar permisos usando el modelo
            const tienePermisos = await FirmaDigitalModel.verificarPermisos(firma_id, usuario_id, req.usuario.rol);
            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para acceder a esta firma'
                });
            }

            // Obtener información usando el modelo
            const firma = await FirmaDigitalModel.obtenerInfoParaFirma(firma_id);

            if (!firma) {
                return res.status(404).json({
                    success: false,
                    message: 'Proceso de firma no encontrado'
                });
            }

            const contrato = firma.contratos;

            // Verificación de relación firma-contrato
            if (!contrato) {
                console.error('. Contrato no encontrado para firma:', firma_id);
                
                try {
                    // Intentar reparar la relación automáticamente
                    const resultadoReparacion = await FirmaDigitalModel.repararRelacionFirmaContrato(firma_id);
                    if (resultadoReparacion) {
                        console.log('. Relación reparada automáticamente');
                        // Re-obtener la firma después de la reparación
                        const firmaReparada = await FirmaDigitalModel.obtenerInfoParaFirma(firma_id);
                        return await this.prepararRespuestaFirma(res, firmaReparada);
                    }
                } catch (reparacionError) {
                    console.error('. Error reparando relación:', reparacionError);
                }

                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado para este proceso de firma'
                });
            }

            if (!contrato.ruta_documento) {
                console.error('. Contrato sin documento:', contrato.id);
                return res.status(404).json({
                    success: false,
                    message: 'El contrato no tiene documento Word generado'
                });
            }

            console.log('. Contrato encontrado:', contrato.ruta_documento);

            // Obtener información del solicitante
            const { data: solicitudCompleta, error: solicitudError } = await supabase
                .from('solicitudes_credito')
                .select(`
                    numero_solicitud,
                    solicitantes: solicitantes!solicitante_id(
                        usuarios(*),
                        nombre_empresa,
                        cuit,
                        representante_legal,
                        domicilio
                    )
                `)
                .eq('id', firma.solicitud_id)
                .single();

            // Preparar datos del contrato
            const datosContrato = {
                nombre_completo: solicitudCompleta?.solicitantes?.usuarios?.nombre_completo,
                dni: solicitudCompleta?.solicitantes?.usuarios?.dni,
                domicilio: solicitudCompleta?.solicitantes?.domicilio,
                nombre_empresa: solicitudCompleta?.solicitantes?.nombre_empresa,
                cuit: solicitudCompleta?.solicitantes?.cuit,
                representante_legal: solicitudCompleta?.solicitantes?.representante_legal,
                email: solicitudCompleta?.solicitantes?.usuarios?.email,
                numero_solicitud: solicitudCompleta?.numero_solicitud
            };

            console.log('. Datos del contrato preparados:', datosContrato);

            // Obtener el documento Word original usando el modelo
            const fileData = await FirmaDigitalModel.obtenerDocumentoParaFirma(firma_id);
            const buffer = Buffer.from(await fileData.arrayBuffer());
            const documentoBase64 = buffer.toString('base64');

            // Preparar respuesta
            const responseData = {
                firma: {
                    id: firma.id,
                    estado: firma.estado,
                    fecha_expiracion: firma.fecha_expiracion,
                    solicitudes_credito: firma.solicitudes_credito || {}
                },
                documento: documentoBase64,
                nombre_documento: `contrato-${firma.solicitudes_credito?.numero_solicitud || 'sin-numero'}.docx`,
                tipo_documento: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                fecha_expiracion: firma.fecha_expiracion,
                solicitante: solicitudCompleta?.solicitantes?.usuarios,
                hash_original: firma.hash_documento_original,
                datos_contrato: datosContrato
            };

            console.log('. Información de firma obtenida exitosamente');
            res.json({
                success: true,
                data: responseData
            });

        } catch (error) {
            console.error('. Error obteniendo información de firma Word:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo información de firma: ' + error.message
            });
        }
    }

    /**
     * Procesar firma del documento
     */
    static async procesarFirma(req, res) {
        try {
            const { firma_id } = req.params;
            const { 
                firma_data, 
                tipo_firma
            } = req.body;
            
            const usuario_id = req.usuario.id;
            const ip_address = req.ip;
            const user_agent = req.get('User-Agent');

            console.log('. Procesando firma Word . para:', firma_id);

            // Validaciones
            if (!firma_data || !tipo_firma) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de firma y tipo son requeridos'
                });
            }

            // Verificar permisos usando el modelo
            const tienePermisos = await FirmaDigitalModel.verificarPermisos(firma_id, usuario_id, req.usuario.rol);
            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para firmar este documento'
                });
            }

            // Obtener información actual de la firma usando el modelo
            const firmaActual = await FirmaDigitalModel.obtenerPorId(firma_id);
            if (!firmaActual) {
                return res.status(404).json({
                    success: false,
                    message: 'Proceso de firma no encontrado'
                });
            }

            // Preparar datos de firma
            const datosFirma = {
                nombreFirmante: req.usuario.nombre_completo,
                fechaFirma: new Date().toISOString(),
                ubicacion: firma_data.ubicacion || 'Ubicación no disponible',
                firmaTexto: firma_data.firmaTexto,
                firmaImagen: firma_data.firmaImagen,
                tipoFirma: firma_data.tipoFirma,
                hashDocumento: firmaActual.hash_documento_original,
                ipFirmante: ip_address,
                userAgent: user_agent
            };

            // Procesar firma acumulativa
            const firmaResult = await WordService.procesarFirmaAcumulativa(
                firma_id, 
                datosFirma, 
                tipo_firma
            );

            if (!firmaResult.success) {
                throw new Error('Error procesando firma: ' + firmaResult.error);
            }

            // Verificar integridad completa
            const integridadValida = await WordService.verificarIntegridadCompleta(firma_id);
            const esIntegridadValida = Boolean(integridadValida);

            // Determinar nuevo estado
            let nuevoEstado;
            if (esIntegridadValida) {
                nuevoEstado = 'firmado_completo';
            } else if (tipo_firma === 'solicitante') {
                nuevoEstado = 'firmado_solicitante';
            } else if (tipo_firma === 'operador') {
                nuevoEstado = 'firmado_operador';
            }

            // Actualizar usando el modelo
            const updateData = {
                hash_documento_firmado: firmaResult.hash,
                integridad_valida: esIntegridadValida,
                estado: nuevoEstado,
                fecha_firma_completa: esIntegridadValida ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
                url_documento_firmado: firmaResult.ruta
            };

            if (tipo_firma === 'solicitante') {
                updateData.fecha_firma_solicitante = new Date().toISOString();
                updateData.ip_firmante = ip_address;
                updateData.user_agent_firmante = user_agent;
                updateData.ubicacion_firmante = datosFirma.ubicacion;
            } else if (tipo_firma === 'operador') {
                updateData.fecha_firma_operador = new Date().toISOString();
            }

            const firmaActualizada = await FirmaDigitalModel.actualizar(firma_id, updateData);

            // Registrar auditoría usando el modelo
            await FirmaDigitalModel.registrarAuditoria({
                firma_id: firma_id,
                usuario_id: usuario_id,
                accion: 'firma_documento_acumulativa',
                descripcion: `Documento firmado por ${tipo_firma}. Estado: ${nuevoEstado}. Integridad: ${esIntegridadValida ? 'COMPLETA' : 'PARCIAL'}`,
                estado_anterior: firmaActual.estado,
                estado_nuevo: nuevoEstado,
                ip_address: ip_address,
                user_agent: user_agent,
                created_at: new Date().toISOString()
            });

            // Procesar según el tipo de firma
            if (tipo_firma === 'solicitante') {
                await FirmaDigitalController.procesarFirmaSolicitante(firma_id, firmaActual);
            } else if (tipo_firma === 'operador') {
                await FirmaDigitalController.procesarFirmaOperador(firma_id, firmaActual);
            }

            // Si la integridad es completa, notificar a todas las partes
            if (esIntegridadValida) {
                await FirmaDigitalController.marcarFirmaCompleta(firma_id, firmaActual);
            }

            console.log('. . Firma acumulativa procesada exitosamente:', { 
                firma_id, 
                tipo_firma, 
                integridad_completa: esIntegridadValida,
                nuevo_estado: nuevoEstado
            });

            res.json({
                success: true,
                message: esIntegridadValida ? 
                    '. CONTRATO COMPLETAMENTE FIRMADO - Integridad válida' : 
                    '. Firma procesada exitosamente - Esperando contrafirma',
                data: {
                    firma_id: firma_id,
                    estado: nuevoEstado,
                    integridad_valida: esIntegridadValida,
                    url_descarga: firmaResult.ruta,
                    hash_firmado: firmaResult.hash,
                    es_firma_completa: esIntegridadValida,
                    firmas_presentes: {
                        solicitante: tipo_firma === 'solicitante' || !!firmaActual.fecha_firma_solicitante,
                        operador: tipo_firma === 'operador' || !!firmaActual.fecha_firma_operador
                    }
                }
            });

        } catch (error) {
            console.error('. . Error procesando firma acumulativa:', error);
            res.status(500).json({
                success: false,
                message: 'Error procesando firma: ' + error.message
            });
        }
    }

    /**
     * Obtener documento para firma (base64)
     */
    static async obtenerDocumentoParaFirma(req, res) {
        try {
            const { firma_id } = req.params;

            // Verificar permisos
            const tienePermisos = await FirmaDigitalModel.verificarPermisos(firma_id, req.usuario.id, req.usuario.rol);
            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para acceder a este documento'
                });
            }

            const fileData = await FirmaDigitalModel.obtenerDocumentoParaFirma(firma_id);
            const buffer = Buffer.from(await fileData.arrayBuffer());
            const documentoBase64 = buffer.toString('base64');

            res.json({
                success: true,
                data: {
                    documento: documentoBase64,
                    tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                }
            });

        } catch (error) {
            console.error('. Error obteniendo documento:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo documento: ' + error.message
            });
        }
    }

    /**
     * Obtener firmas pendientes para dashboard usando el modelo
     */
    static async obtenerFirmasPendientes(req, res) {
        try {
            const usuario_id = req.usuario.id;
            const usuario_rol = req.usuario.rol;

            const firmas = await FirmaDigitalModel.obtenerPendientesPorUsuario(usuario_id, usuario_rol);

            res.json({
                success: true,
                data: firmas
            });

        } catch (error) {
            console.error('Error obteniendo firmas pendientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo firmas pendientes'
            });
        }
    }

    /**
     * Obtener auditoría de firma usando el modelo
     */
    static async obtenerAuditoriaFirma(req, res) {
        try {
            const { firma_id } = req.params;

            // Verificar permisos
            const tienePermisos = await FirmaDigitalModel.verificarPermisos(firma_id, req.usuario.id, req.usuario.rol);
            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para acceder a esta auditoría'
                });
            }

            const auditoria = await FirmaDigitalModel.obtenerAuditoria(firma_id);

            res.json({
                success: true,
                data: auditoria
            });

        } catch (error) {
            console.error('Error obteniendo auditoría de firma:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo historial de auditoría'
            });
        }
    }

    /**
     * Obtener estadísticas de firmas usando el modelo
     */
    static async obtenerEstadisticasFirmas(req, res) {
        try {
            const usuario_id = req.usuario.id;
            const usuario_rol = req.usuario.rol;

            const estadisticas = await FirmaDigitalModel.obtenerEstadisticas(usuario_id, usuario_rol);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas de firmas:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas'
            });
        }
    }

    /**
     * Renovar firma expirada usando el modelo
     */
    static async renovarFirmaExpirada(req, res) {
        try {
            const { firma_id } = req.params;
            const usuario_id = req.usuario.id;

            console.log('. Renovando firma expirada:', firma_id);

            const firmaRenovada = await FirmaDigitalModel.renovarFirmaExpirada(firma_id);

            // Registrar auditoría
            await FirmaDigitalModel.registrarAuditoria({
                firma_id: firma_id,
                usuario_id: usuario_id,
                accion: 'renovar_firma_expirada',
                descripcion: 'Firma expirada renovada exitosamente',
                estado_anterior: 'expirado',
                estado_nuevo: 'enviado',
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                created_at: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Firma renovada exitosamente',
                data: {
                    firma_id: firmaRenovada.id,
                    fecha_expiracion: firmaRenovada.fecha_expiracion
                }
            });

        } catch (error) {
            console.error('. Error renovando firma expirada:', error);
            res.status(500).json({
                success: false,
                message: 'Error renovando firma expirada'
            });
        }
    }

    /**
     * Reparar relación firma-contrato usando el modelo
     */
    static async repararRelacionFirmaContrato(req, res) {
        try {
            const { firma_id } = req.params;
            const usuario_id = req.usuario.id;

            console.log('. Reparando relación firma-contrato para:', firma_id);

            const resultado = await FirmaDigitalModel.repararRelacionFirmaContrato(firma_id);

            // Registrar auditoría
            await FirmaDigitalModel.registrarAuditoria({
                firma_id: firma_id,
                usuario_id: usuario_id,
                accion: 'reparar_relacion_firma_contrato',
                descripcion: 'Relación firma-contrato reparada manualmente',
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                created_at: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Relación firma-contrato reparada exitosamente',
                data: {
                    firma_id: resultado.firma.id,
                    contrato_id: resultado.contrato.id,
                    contrato_ruta_documento: resultado.contrato.ruta_documento
                }
            });

        } catch (error) {
            console.error('. Error reparando relación:', error);
            res.status(500).json({
                success: false,
                message: 'Error reparando relación: ' + error.message
            });
        }
    }

    /**
     * Verificar si existe proceso de firma para una solicitud usando el modelo
     */
    static async verificarFirmaExistente(req, res) {
        try {
            const { solicitud_id } = req.params;

            const firmaExistente = await FirmaDigitalModel.verificarFirmaActiva(solicitud_id);

            res.json({
                success: true,
                data: {
                    firma_existente: firmaExistente || null,
                    existe: !!firmaExistente
                }
            });

        } catch (error) {
            console.error('. Error verificando firma existente:', error);
            res.status(500).json({
                success: false,
                message: 'Error verificando firma existente'
            });
        }
    }

    // ========== MÉTODOS AUXILIARES ==========

    /**
     * Procesar firma del solicitante
     */
    static async procesarFirmaSolicitante(firmaId, firma) {
        try {
            console.log('👤 Procesando firma del solicitante:', firmaId);

            // Notificar al operador
            await NotificacionesController.notificarFirmaSolicitanteCompletada(firma.contrato_id);

            // Actualizar estado del contrato
            await supabase
                .from('contratos')
                .update({
                    estado: 'firmado_solicitante',
                    fecha_firma_solicitante: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', firma.contrato_id);

        } catch (error) {
            console.error('. Error procesando firma del solicitante:', error);
        }
    }

    /**
     * Procesar firma del operador
     */
    static async procesarFirmaOperador(firmaId, firma) {
        try {
            console.log('👨‍💼 Procesando firma del operador:', firmaId);

            // Verificar si ambas partes han firmado
            const firmaActual = await FirmaDigitalModel.obtenerPorId(firmaId);

            if (firmaActual.fecha_firma_solicitante && firmaActual.fecha_firma_operador) {
                // Ambas partes han firmado - marcar como completo
                await FirmaDigitalController.marcarFirmaCompleta(firmaId, firma);
            } else {
                // Solo el operador ha firmado - notificar
                await NotificacionesController.notificarFirmaOperadorCompletada(firma.contrato_id);
            }

        } catch (error) {
            console.error('. Error procesando firma del operador:', error);
        }
    }

    /**
     * Marcar firma como completa
     */
    static async marcarFirmaCompleta(firmaId, firma) {
        try {
            console.log('. Marcando firma como completa:', firmaId);

            await FirmaDigitalModel.actualizar(firmaId, {
                estado: 'firmado_completo',
                fecha_firma_completa: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            // Actualizar contrato
            await supabase
                .from('contratos')
                .update({
                    estado: 'firmado_completo',
                    fecha_firma_completa: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', firma.contrato_id);

            // Notificar a todas las partes
            await NotificacionesController.notificarFirmaCompletada(firma.contrato_id, firma.solicitud_id);

            console.log('. Contrato completamente firmado:', firma.contrato_id);

        } catch (error) {
            console.error('. Error marcando firma como completa:', error);
        }
    }

    /**
     * Crear solicitud de firma múltiple
     */
    static async crearSolicitudFirmaMultiple(contratoId, solicitante, operador) {
        try {
            console.log('. Creando solicitud de firma múltiple INTERNA para documento ID:', contratoId);

            const signatureRequestId = crypto.randomUUID();

            const urlFirmaSolicitante = `/firmar-contrato/${signatureRequestId}?tipo=solicitante`;
            const urlFirmaOperador = `/firmar-contrato/${signatureRequestId}?tipo=operador`;

            console.log('. Solicitud de firma múltiple interna creada:', {
                signatureRequestId,
                contratoId
            });

            return {
                success: true,
                signatureRequestId: signatureRequestId,
                urlsFirma: {
                    solicitante: urlFirmaSolicitante,
                    operador: urlFirmaOperador
                },
                data: {
                    tipo: 'firma_multiple_interna',
                    urls: {
                        solicitante: urlFirmaSolicitante,
                        operador: urlFirmaOperador
                    },
                    expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            };
        } catch (error) {
            console.error('. Error creando solicitud de firma múltiple interna:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Crear solicitud de firma individual - FALLBACK
     */
    static async crearSolicitudFirmaIndividual(contratoId, destinatario, tipoFirmante = 'solicitante') {
        try {
            console.log('. Creando solicitud de firma individual interna:', { contratoId, tipoFirmante });

            const signatureRequestId = crypto.randomUUID();
            const urlFirma = `/firmar-contrato/${signatureRequestId}?tipo=${tipoFirmante}`;

            console.log('. Solicitud de firma individual interna creada:', {
                signatureRequestId,
                contratoId
            });

            return {
                success: true,
                signatureRequestId: signatureRequestId,
                urlFirma: urlFirma,
                data: {
                    tipo: 'firma_individual_interna',
                    url: urlFirma,
                    expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            };
        } catch (error) {
            console.error('. Error creando solicitud de firma individual interna:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtener número aproximado de páginas Word
     */
    static async obtenerNumeroPaginasWord(buffer) {
        try {
            const texto = buffer.toString('utf8');
            const palabras = texto.split(/\s+/).length;
            const paginasEstimadas = Math.max(1, Math.ceil(palabras / 1800));
            return paginasEstimadas;
        } catch (error) {
            console.error('Error obteniendo número de páginas Word:', error);
            return 1;
        }
    }

    /**
     * Método auxiliar para preparar respuesta de firma
     */
    static async prepararRespuestaFirma(res, firma) {
        // Implementación para preparar respuesta consistente
        const contrato = firma.contratos;

        if (!contrato || !contrato.ruta_documento) {
            return res.status(404).json({
                success: false,
                message: 'Documento no disponible'
            });
        }

        // Obtener documento y preparar respuesta
        const fileData = await FirmaDigitalModel.obtenerDocumentoParaFirma(firma.id);
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const documentoBase64 = buffer.toString('base64');

        const responseData = {
            firma: {
                id: firma.id,
                estado: firma.estado,
                fecha_expiracion: firma.fecha_expiracion
            },
            documento: documentoBase64,
            nombre_documento: `contrato-${firma.solicitudes_credito?.numero_solicitud || 'sin-numero'}.docx`,
            tipo_documento: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        return res.json({
            success: true,
            data: responseData
        });
    }
}

module.exports = FirmaDigitalController;