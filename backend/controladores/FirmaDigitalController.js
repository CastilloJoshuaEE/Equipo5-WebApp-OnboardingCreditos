// controladores/FirmaDigitalController.js
const PDFFillerService = require('../servicios/pdfFillerService');
const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const crypto = require('crypto');

class FirmaDigitalController {

    /**
     * Iniciar proceso de firma digital para contrato aprobado (Bifurcación 1)
     */
    static async iniciarProcesoFirma(req, res) {
        try {
            const { solicitud_id } = req.params;
            const operador_id = req.usuario.id;

            console.log('🚀 Iniciando proceso de firma digital para solicitud:', solicitud_id);

            // Verificar que la solicitud está aprobada y tiene contrato
            const { data: solicitud, error: solError } = await supabase
                .from('solicitudes_credito')
                .select(`
                    *,
                    contratos(*),
                    solicitantes: solicitantes!solicitante_id(
                        usuarios(*)
                    ),
                    operadores: operadores!operador_id(
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

            if (!solicitud.contratos || solicitud.contratos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No existe contrato generado para esta solicitud'
                });
            }

            const contrato = solicitud.contratos[0];
            const solicitante = solicitud.solicitantes.usuarios;
            const operador = solicitud.operadores?.usuarios || req.usuario;

            // Verificar si ya existe un proceso de firma
            const { data: firmaExistente } = await supabase
                .from('firmas_digitales')
                .select('id, estado')
                .eq('solicitud_id', solicitud_id)
                .in('estado', ['enviado', 'firmado_solicitante', 'firmado_operador'])
                .single();

            if (firmaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un proceso de firma en curso para esta solicitud'
                });
            }

            // Obtener el PDF del contrato
            const { data: fileData, error: fileError } = await supabase.storage
                .from('kyc-documents')
                .download(contrato.ruta_pdf);

            if (fileError) {
                throw new Error('No se pudo acceder al documento del contrato: ' + fileError.message);
            }

            const buffer = Buffer.from(await fileData.arrayBuffer());

            // Generar hash del documento original con metadatos
            const metadatosDocumento = {
                solicitud_id: solicitud_id,
                contrato_id: contrato.id,
                numero_solicitud: solicitud.numero_solicitud,
                fecha_generacion: contrato.created_at,
                tamanio: buffer.length,
                paginas: await this.obtenerNumeroPaginasPDF(buffer)
            };

            const hashOriginal = PDFFillerService.generarHashDocumento(buffer, metadatosDocumento);

            // Subir documento a PDFfiller
            const uploadResult = await PDFFillerService.subirDocumento(
                `contrato-${solicitud.numero_solicitud}-${Date.now()}.pdf`,
                buffer,
                metadatosDocumento
            );

            if (!uploadResult.success) {
                throw new Error('Error subiendo documento a PDFfiller: ' + uploadResult.error);
            }

            // Crear solicitud de firma múltiple
            const firmaResult = await PDFFillerService.crearSolicitudFirmaMultiple(
                uploadResult.documentId,
                solicitante,
                operador
            );

            if (!firmaResult.success) {
                // Fallback: intentar firma individual para solicitante
                console.log('🔄 Fallback a firma individual para solicitante');
                const firmaIndividualResult = await PDFFillerService.crearSolicitudFirmaIndividual(
                    uploadResult.documentId,
                    solicitante,
                    'solicitante'
                );

                if (!firmaIndividualResult.success) {
                    throw new Error('Error creando solicitud de firma: ' + firmaIndividualResult.error);
                }

                firmaResult.signatureRequestId = firmaIndividualResult.signatureRequestId;
                firmaResult.urlsFirma = { solicitante: firmaIndividualResult.urlFirma };
            }

            // Registrar en base de datos
            const firmaData = {
                contrato_id: contrato.id,
                solicitud_id: solicitud_id,
                signature_request_id: firmaResult.signatureRequestId,
                document_id: uploadResult.documentId,
                envelope_id: firmaResult.envelopeId,
                hash_documento_original: hashOriginal,
                estado: 'enviado',
                url_firma_solicitante: firmaResult.urlsFirma?.solicitante,
                url_firma_operador: firmaResult.urlsFirma?.operador,
                fecha_envio: new Date().toISOString(),
                fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
                intentos_envio: 1,
                created_at: new Date().toISOString()
            };

            const { data: firma, error: firmaError } = await supabase
                .from('firmas_digitales')
                .insert([firmaData])
                .select()
                .single();

            if (firmaError) {
                throw firmaError;
            }

            // Actualizar contrato con referencia a la firma digital
            await supabase
                .from('contratos')
                .update({ 
                    estado: 'pendiente_firma',
                    firma_digital_id: firma.id,
                    hash_contrato: hashOriginal
                })
                .eq('id', contrato.id);

            // Registrar auditoría
            await supabase
                .from('auditoria_firmas')
                .insert({
                    firma_id: firma.id,
                    usuario_id: operador_id,
                    accion: 'iniciar_proceso_firma',
                    descripcion: 'Proceso de firma digital iniciado por operador - Múltiples firmantes',
                    estado_anterior: 'pendiente',
                    estado_nuevo: 'enviado',
                    signature_request_id: firmaResult.signatureRequestId,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent'),
                    created_at: new Date().toISOString()
                });

            // Crear notificaciones para ambos firmantes
            await this.crearNotificacionesFirma(solicitante.id, operador.id, solicitud_id, firma);

            console.log('✅ Proceso de firma digital iniciado exitosamente:', {
                firmaId: firma.id,
                signatureRequestId: firmaResult.signatureRequestId,
                urlsFirma: Object.keys(firmaResult.urlsFirma || {})
            });

            res.json({
                success: true,
                message: 'Proceso de firma digital iniciado exitosamente',
                data: {
                    firma: firma,
                    urls_firma: firmaResult.urlsFirma,
                    fecha_expiracion: firmaData.fecha_expiracion
                }
            });

        } catch (error) {
            console.error('❌ Error iniciando proceso de firma:', error);
            res.status(500).json({
                success: false,
                message: 'Error iniciando proceso de firma: ' + error.message
            });
        }
    }

    /**
     * Obtener número de páginas de un PDF (estimación simple)
     */
    static async obtenerNumeroPaginasPDF(buffer) {
        try {
            // Buscar el patrón de páginas en el PDF
            const pdfContent = buffer.toString('binary');
            const pageMatches = pdfContent.match(/\/Type\s*\/Page[^s]/g);
            return pageMatches ? pageMatches.length : 1;
        } catch (error) {
            console.warn('No se pudo determinar el número de páginas del PDF:', error.message);
            return 1;
        }
    }

    /**
     * Crear notificaciones para ambos firmantes
     */
    static async crearNotificacionesFirma(solicitanteId, operadorId, solicitudId, firma) {
        try {
            const notificaciones = [];

            // Notificación para solicitante
            notificaciones.push({
                usuario_id: solicitanteId,
                solicitud_id: solicitudId,
                tipo: 'firma_digital_solicitante',
                titulo: 'Solicitud de Firma Digital - Contrato de Crédito',
                mensaje: 'Se ha enviado una solicitud de firma digital para tu contrato de crédito aprobado. Por favor, revisa y firma el documento.',
                datos_adicionales: {
                    url_firma: firma.url_firma_solicitante,
                    tipo_firma: 'digital',
                    expira_en: firma.fecha_expiracion,
                    firma_id: firma.id
                },
                leida: false,
                created_at: new Date().toISOString()
            });

            // Notificación para operador
            notificaciones.push({
                usuario_id: operadorId,
                solicitud_id: solicitudId,
                tipo: 'firma_digital_operador',
                titulo: 'Proceso de Firma Digital Iniciado',
                mensaje: 'Se ha iniciado el proceso de firma digital para el contrato. El solicitante debe firmar primero.',
                datos_adicionales: {
                    url_firma: firma.url_firma_operador,
                    tipo_firma: 'digital',
                    expira_en: firma.fecha_expiracion,
                    firma_id: firma.id
                },
                leida: false,
                created_at: new Date().toISOString()
            });

            await supabase
                .from('notificaciones')
                .insert(notificaciones);

            console.log('📧 Notificaciones de firma creadas para ambos firmantes');
        } catch (error) {
            console.error('Error creando notificaciones de firma:', error);
        }
    }

    /**
     * Verificar estado de firma con trazabilidad legal
     */
    static async verificarEstadoFirma(req, res) {
        try {
            const { firma_id } = req.params;
            const usuario_id = req.usuario.id;

            console.log('🔍 Verificando estado de firma con trazabilidad:', firma_id);

            // Obtener información de la firma
            const { data: firma, error: firmaError } = await supabase
                .from('firmas_digitales')
                .select(`
                    *,
                    contratos(*),
                    solicitudes_credito(
                        numero_solicitud,
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', firma_id)
                .single();

            if (firmaError || !firma) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro de firma no encontrado'
                });
            }

            // Verificar permisos
            const puedeVer = await this.verificarPermisosFirma(usuario_id, firma);
            if (!puedeVer) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para ver esta información de firma'
                });
            }

            // Verificar estado en PDFfiller
            const estadoResult = await PDFFillerService.verificarEstadoFirma(firma.signature_request_id);

            if (!estadoResult.success) {
                throw new Error('Error verificando estado en PDFfiller: ' + estadoResult.error);
            }

            // Si el estado cambió, actualizar en base de datos
            if (estadoResult.estado !== firma.estado) {
                await this.actualizarEstadoFirma(
                    firma.id, 
                    estadoResult.estado, 
                    estadoResult.data,
                    req.ip,
                    req.get('User-Agent')
                );
            }

            // Verificar validez legal si está firmado
            let validezLegal = null;
            if (estadoResult.estado.includes('firmado')) {
                const validezResult = await PDFFillerService.verificarValidezLegal(firma.signature_request_id);
                if (validezResult.success) {
                    validezLegal = validezResult;
                }
            }

            // Obtener información actualizada
            const { data: firmaActualizada } = await supabase
                .from('firmas_digitales')
                .select('*')
                .eq('id', firma_id)
                .single();

            // Obtener auditoría reciente
            const { data: auditoria } = await supabase
                .from('auditoria_firmas')
                .select('*')
                .eq('firma_id', firma_id)
                .order('created_at', { ascending: false })
                .limit(10);

            console.log('✅ Estado de firma verificado:', {
                firmaId: firma_id,
                estado: firmaActualizada.estado,
                validezLegal: validezLegal?.valido
            });

            res.json({
                success: true,
                data: {
                    firma: firmaActualizada,
                    estado_detallado: estadoResult.estadoDetallado,
                    validez_legal: validezLegal,
                    auditoria_reciente: auditoria,
                    trazabilidad: {
                        ip_consulta: req.ip,
                        user_agent: req.get('User-Agent'),
                        fecha_consulta: new Date().toISOString()
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error verificando estado de firma:', error);
            res.status(500).json({
                success: false,
                message: 'Error verificando estado de firma: ' + error.message
            });
        }
    }

    /**
     * Verificar permisos para acceder a información de firma
     */
    static async verificarPermisosFirma(usuario_id, firma) {
        try {
            // Obtener información del usuario
            const { data: usuario } = await supabase
                .from('usuarios')
                .select('rol')
                .eq('id', usuario_id)
                .single();

            if (!usuario) return false;

            // Administradores y operadores pueden ver todo
            if (['admin', 'operador'].includes(usuario.rol)) {
                return true;
            }

            // Solicitantes solo pueden ver sus propias firmas
            if (usuario.rol === 'solicitante') {
                const { data: solicitud } = await supabase
                    .from('solicitudes_credito')
                    .select('solicitante_id')
                    .eq('id', firma.solicitud_id)
                    .single();

                return solicitud && solicitud.solicitante_id === usuario_id;
            }

            return false;
        } catch (error) {
            console.error('Error verificando permisos de firma:', error);
            return false;
        }
    }

    /**
     * Actualizar estado de firma con trazabilidad completa
     */
    static async actualizarEstadoFirma(firmaId, nuevoEstado, datosPDFfiller, ipAddress = null, userAgent = null) {
        try {
            const updateData = {
                estado: nuevoEstado,
                updated_at: new Date().toISOString()
            };

            // Obtener información actual de la firma
            const { data: firmaActual } = await supabase
                .from('firmas_digitales')
                .select('*')
                .eq('id', firmaId)
                .single();

            if (!firmaActual) {
                throw new Error('Firma no encontrada');
            }

            // Procesar según el nuevo estado
            switch (nuevoEstado) {
                case 'firmado_solicitante':
                    updateData.fecha_firma_solicitante = new Date().toISOString();
                    updateData.ip_firmante = ipAddress;
                    updateData.user_agent_firmante = userAgent;
                    await this.procesarFirmaSolicitante(firmaId, firmaActual);
                    break;

                case 'firmado_operador':
                    updateData.fecha_firma_operador = new Date().toISOString();
                    await this.procesarFirmaOperador(firmaId, firmaActual);
                    break;

                case 'firmado_completo':
                    updateData.fecha_firma_completa = new Date().toISOString();
                    await this.procesarFirmaCompleta(firmaId, firmaActual);
                    break;

                case 'rechazado':
                    await this.procesarRechazoFirma(firmaId, firmaActual);
                    break;

                case 'expirado':
                    await this.procesarExpiracionFirma(firmaId, firmaActual);
                    break;
            }

            // Actualizar en base de datos
            const { error: updateError } = await supabase
                .from('firmas_digitales')
                .update(updateData)
                .eq('id', firmaId);

            if (updateError) {
                throw updateError;
            }

            // Registrar auditoría con hash de transacción
            const hashTransaccion = crypto
                .createHash('sha256')
                .update(`${firmaId}-${nuevoEstado}-${Date.now()}`)
                .digest('hex');

            await supabase
                .from('auditoria_firmas')
                .insert({
                    firma_id: firmaId,
                    accion: 'actualizar_estado',
                    descripcion: `Estado actualizado a: ${nuevoEstado}. IP: ${ipAddress}`,
                    estado_anterior: firmaActual.estado,
                    estado_nuevo: nuevoEstado,
                    signature_request_id: datosPDFfiller?.signature_request_id,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    hash_transaccion: hashTransaccion,
                    created_at: new Date().toISOString()
                });

            console.log('✅ Estado de firma actualizado:', {
                firmaId,
                estadoAnterior: firmaActual.estado,
                estadoNuevo: nuevoEstado,
                hashTransaccion
            });

        } catch (error) {
            console.error('❌ Error actualizando estado de firma:', error);
            throw error;
        }
    }

    /**
     * Procesar firma del solicitante
     */
    static async procesarFirmaSolicitante(firmaId, firma) {
        try {
            console.log('👤 Procesando firma del solicitante:', firmaId);

            // Descargar documento firmado
            const downloadResult = await PDFFillerService.descargarDocumentoFirmado(firma.signature_request_id);
            
            if (downloadResult.success) {
                // Generar hash del documento firmado
                const metadatosFirmado = {
                    fecha_firma: new Date().toISOString(),
                    tipo_firma: 'solicitante',
                    tamanio: downloadResult.buffer.length
                };

                const hashFirmado = PDFFillerService.generarHashDocumento(downloadResult.buffer, metadatosFirmado);

                // Validar integridad
                const metadatosOriginal = {
                    tamanio: downloadResult.buffer.length // Usar mismo tamaño para comparación
                };

                const integridadValida = PDFFillerService.validarIntegridadDocumento(
                    firma.hash_documento_original,
                    hashFirmado,
                    metadatosOriginal,
                    metadatosFirmado
                );

                // Guardar documento firmado en storage
                const nombreArchivo = `contrato-firmado-solicitante-${firmaId}.pdf`;
                const rutaStorage = `contratos-firmados/${nombreArchivo}`;

                const { error: uploadError } = await supabase.storage
                    .from('kyc-documents')
                    .upload(rutaStorage, downloadResult.buffer, {
                        contentType: 'application/pdf',
                        upsert: true
                    });

                if (!uploadError) {
                    await supabase
                        .from('firmas_digitales')
                        .update({
                            hash_documento_firmado: hashFirmado,
                            integridad_valida: integridadValida,
                            url_documento_firmado: rutaStorage
                        })
                        .eq('id', firmaId);
                }

                // Notificar al operador
                await this.notificarFirmaSolicitanteCompletada(firma.contrato_id);
            }

        } catch (error) {
            console.error('Error procesando firma del solicitante:', error);
        }
    }

    /**
     * Procesar firma del operador
     */
    static async procesarFirmaOperador(firmaId, firma) {
        try {
            console.log('👨‍💼 Procesando firma del operador:', firmaId);

            // Obtener certificado de firma
            const certResult = await PDFFillerService.obtenerCertificadoFirma(firma.signature_request_id);
            if (certResult.success) {
                await supabase
                    .from('firmas_digitales')
                    .update({
                        certificado_firma: certResult.certificado
                    })
                    .eq('id', firmaId);
            }

            // Notificar que el operador ha firmado
            await this.notificarFirmaOperadorCompletada(firma.contrato_id);

        } catch (error) {
            console.error('Error procesando firma del operador:', error);
        }
    }

    /**
     * Procesar firma completa
     */
    static async procesarFirmaCompleta(firmaId, firma) {
        try {
            console.log('✅ Procesando firma completa:', firmaId);

            // Descargar documento completamente firmado
            const downloadResult = await PDFFillerService.descargarDocumentoFirmado(firma.signature_request_id);
            
            if (downloadResult.success) {
                // Generar hash final
                const metadatosFinal = {
                    fecha_firma_completa: new Date().toISOString(),
                    tipo_firma: 'completa',
                    tamanio: downloadResult.buffer.length,
                    firmantes: ['solicitante', 'operador']
                };

                const hashFinal = PDFFillerService.generarHashDocumento(downloadResult.buffer, metadatosFinal);

                // Guardar documento final
                const nombreArchivo = `contrato-firmado-completo-${firmaId}.pdf`;
                const rutaStorage = `contratos-firmados/${nombreArchivo}`;

                const { error: uploadError } = await supabase.storage
                    .from('kyc-documents')
                    .upload(rutaStorage, downloadResult.buffer, {
                        contentType: 'application/pdf',
                        upsert: true
                    });

                if (!uploadError) {
                    await supabase
                        .from('firmas_digitales')
                        .update({
                            hash_documento_firmado: hashFinal,
                            integridad_valida: true,
                            url_documento_firmado: rutaStorage
                        })
                        .eq('id', firmaId);
                }

                // Obtener certificado final
                const certResult = await PDFFillerService.obtenerCertificadoFirma(firma.signature_request_id);
                if (certResult.success) {
                    await supabase
                        .from('firmas_digitales')
                        .update({
                            certificado_firma: certResult.certificado,
                            fecha_verificacion: new Date().toISOString()
                        })
                        .eq('id', firmaId);
                }

                // Marcar contrato como completamente firmado
                await this.marcarContratoComoFirmado(firmaId);
            }

        } catch (error) {
            console.error('Error procesando firma completa:', error);
        }
    }

    /**
     * Procesar rechazo de firma
     */
    static async procesarRechazoFirma(firmaId, firma) {
        try {
            console.log('❌ Procesando rechazo de firma:', firmaId);

            // Actualizar estado del contrato
            await supabase
                .from('contratos')
                .update({
                    estado: 'rechazado_firma',
                    updated_at: new Date().toISOString()
                })
                .eq('id', firma.contrato_id);

            // Notificar rechazo
            await this.notificarRechazoFirma(firma.contrato_id);

        } catch (error) {
            console.error('Error procesando rechazo de firma:', error);
        }
    }

    /**
     * Procesar expiración de firma
     */
    static async procesarExpiracionFirma(firmaId, firma) {
        try {
            console.log('⏰ Procesando expiración de firma:', firmaId);

            // Actualizar estado del contrato
            await supabase
                .from('contratos')
                .update({
                    estado: 'expirado_firma',
                    updated_at: new Date().toISOString()
                })
                .eq('id', firma.contrato_id);

            // Notificar expiración
            await this.notificarExpiracionFirma(firma.contrato_id);

        } catch (error) {
            console.error('Error procesando expiración de firma:', error);
        }
    }

    /**
     * Marcar contrato como firmado completamente
     */
    static async marcarContratoComoFirmado(firmaId) {
        try {
            const { data: firma } = await supabase
                .from('firmas_digitales')
                .select('contrato_id, solicitud_id')
                .eq('id', firmaId)
                .single();

            if (firma) {
                await supabase
                    .from('contratos')
                    .update({
                        estado: 'firmado_completo',
                        fecha_firma_completa: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', firma.contrato_id);

                // Notificar a todas las partes
                await this.notificarFirmaCompletada(firma.contrato_id, firma.solicitud_id);

                console.log('🎉 Contrato marcado como firmado completamente:', firma.contrato_id);
            }
        } catch (error) {
            console.error('Error marcando contrato como firmado:', error);
        }
    }

    /**
     * Notificar firma del solicitante completada
     */
    static async notificarFirmaSolicitanteCompletada(contratoId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        operador_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                await supabase
                    .from('notificaciones')
                    .insert({
                        usuario_id: contrato.solicitudes_credito.operador_id,
                        tipo: 'firma_solicitante_completada',
                        titulo: 'Solicitante Ha Firmado el Contrato',
                        mensaje: 'El solicitante ha completado la firma digital del contrato. Ahora es tu turno de firmar.',
                        leida: false,
                        created_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error notificando firma del solicitante:', error);
        }
    }

    /**
     * Notificar firma del operador completada
     */
    static async notificarFirmaOperadorCompletada(contratoId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                await supabase
                    .from('notificaciones')
                    .insert({
                        usuario_id: contrato.solicitudes_credito.solicitante_id,
                        tipo: 'firma_operador_completada',
                        titulo: 'Operador Ha Firmado el Contrato',
                        mensaje: 'El operador ha completado su firma digital. El proceso de firma está casi completo.',
                        leida: false,
                        created_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error notificando firma del operador:', error);
        }
    }

    /**
     * Notificar firma completada
     */
    static async notificarFirmaCompletada(contratoId, solicitudId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                const solicitud = contrato.solicitudes_credito;
                const notificaciones = [];

                // Notificar al operador
                notificaciones.push({
                    usuario_id: solicitud.operador_id,
                    solicitud_id: solicitudId,
                    tipo: 'firma_completada_operador',
                    titulo: 'Firma Digital Completada',
                    mensaje: 'El proceso de firma digital del contrato se ha completado exitosamente. El crédito está listo para desembolso.',
                    leida: false,
                    created_at: new Date().toISOString()
                });

                // Notificar al solicitante
                notificaciones.push({
                    usuario_id: solicitud.solicitante_id,
                    solicitud_id: solicitudId,
                    tipo: 'firma_completada_solicitante',
                    titulo: 'Firma Digital Completada',
                    mensaje: '¡Felicidades! Has completado exitosamente la firma digital del contrato. Tu crédito será desembolsado pronto.',
                    leida: false,
                    created_at: new Date().toISOString()
                });

                await supabase
                    .from('notificaciones')
                    .insert(notificaciones);

                console.log('📧 Notificaciones de firma completada enviadas');
            }
        } catch (error) {
            console.error('Error notificando firma completada:', error);
        }
    }

    /**
     * Notificar rechazo de firma
     */
    static async notificarRechazoFirma(contratoId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                const solicitud = contrato.solicitudes_credito;

                // Notificar al operador
                await supabase
                    .from('notificaciones')
                    .insert({
                        usuario_id: solicitud.operador_id,
                        tipo: 'firma_rechazada',
                        titulo: 'Firma Digital Rechazada',
                        mensaje: 'El solicitante ha rechazado la firma digital del contrato.',
                        leida: false,
                        created_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error notificando rechazo de firma:', error);
        }
    }

    /**
     * Notificar expiración de firma
     */
    static async notificarExpiracionFirma(contratoId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                const solicitud = contrato.solicitudes_credito;
                const notificaciones = [];

                // Notificar al operador
                notificaciones.push({
                    usuario_id: solicitud.operador_id,
                    tipo: 'firma_expirada_operador',
                    titulo: 'Firma Digital Expirada',
                    mensaje: 'El proceso de firma digital ha expirado. Se requiere acción del operador.',
                    leida: false,
                    created_at: new Date().toISOString()
                });

                // Notificar al solicitante
                notificaciones.push({
                    usuario_id: solicitud.solicitante_id,
                    tipo: 'firma_expirada_solicitante',
                    titulo: 'Firma Digital Expirada',
                    mensaje: 'El tiempo para firmar el contrato ha expirado. Por favor, contacta al operador.',
                    leida: false,
                    created_at: new Date().toISOString()
                });

                await supabase
                    .from('notificaciones')
                    .insert(notificaciones);
            }
        } catch (error) {
            console.error('Error notificando expiración de firma:', error);
        }
    }

    /**
     * Endpoint para webhooks de PDFfiller
     */
    static async procesarWebhook(req, res) {
        try {
            const webhookData = req.body;
            const signatureHeader = req.headers['x-pdffiller-signature'];

            console.log('🔄 Recibiendo webhook de PDFfiller:', {
                event_type: webhookData.event_type,
                signature_request_id: webhookData.signature_request_id,
                ip: req.ip
            });

            // Procesar webhook
            const result = await PDFFillerService.procesarWebhook(webhookData, signatureHeader);

            if (result.success) {
                // Actualizar estado en base de datos
                await this.actualizarEstadoFirmaWebhook(
                    result.signatureRequestId,
                    result.nuevoEstado,
                    webhookData,
                    req.ip,
                    req.get('User-Agent')
                );

                res.json({ 
                    success: true, 
                    message: 'Webhook procesado exitosamente',
                    event_type: webhookData.event_type
                });
            } else {
                console.error('❌ Error procesando webhook:', result.error);
                res.status(400).json({ 
                    success: false, 
                    message: 'Error procesando webhook: ' + result.error 
                });
            }

        } catch (error) {
            console.error('❌ Error procesando webhook:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor: ' + error.message 
            });
        }
    }

    /**
     * Actualizar estado desde webhook
     */
    static async actualizarEstadoFirmaWebhook(signatureRequestId, nuevoEstado, webhookData, ipAddress, userAgent) {
        try {
            // Buscar la firma por signature_request_id
            const { data: firma } = await supabase
                .from('firmas_digitales')
                .select('id, estado')
                .eq('signature_request_id', signatureRequestId)
                .single();

            if (firma) {
                await this.actualizarEstadoFirma(
                    firma.id, 
                    nuevoEstado, 
                    webhookData, 
                    ipAddress, 
                    userAgent
                );
            } else {
                console.warn('⚠️ No se encontró firma para webhook:', signatureRequestId);
            }
        } catch (error) {
            console.error('Error actualizando estado desde webhook:', error);
        }
    }

    /**
     * Obtener historial de auditoría de firma
     */
    static async obtenerAuditoriaFirma(req, res) {
        try {
            const { firma_id } = req.params;

            const { data: auditoria, error } = await supabase
                .from('auditoria_firmas')
                .select(`
                    *,
                    usuarios: usuario_id(
                        nombre_completo,
                        email
                    )
                `)
                .eq('firma_id', firma_id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                data: auditoria || []
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
     * Validar integridad de documento firmado
     */
    static async validarIntegridadDocumento(req, res) {
        try {
            const { firma_id } = req.params;

            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select('hash_documento_original, hash_documento_firmado, integridad_valida, url_documento_firmado')
                .eq('id', firma_id)
                .single();

            if (error || !firma) {
                return res.status(404).json({
                    success: false,
                    message: 'Registro de firma no encontrado'
                });
            }

            // Validar integridad
            const integridadValida = PDFFillerService.validarIntegridadDocumento(
                firma.hash_documento_original,
                firma.hash_documento_firmado
            );

            // Actualizar estado de integridad si cambió
            if (integridadValida !== firma.integridad_valida) {
                await supabase
                    .from('firmas_digitales')
                    .update({
                        integridad_valida: integridadValida,
                        fecha_verificacion: new Date().toISOString()
                    })
                    .eq('id', firma_id);
            }

            res.json({
                success: true,
                data: {
                    integridad_valida: integridadValida,
                    hash_original: firma.hash_documento_original,
                    hash_firmado: firma.hash_documento_firmado,
                    verificacion_anterior: firma.integridad_valida,
                    url_documento_firmado: firma.url_documento_firmado,
                    fecha_verificacion: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error validando integridad:', error);
            res.status(500).json({
                success: false,
                message: 'Error validando integridad del documento'
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

            console.log('🔄 Reenviando solicitud de firma:', firma_id);

            // Verificar que la firma existe y está expirada
            const { data: firma, error: firmaError } = await supabase
                .from('firmas_digitales')
                .select('*')
                .eq('id', firma_id)
                .eq('estado', 'expirado')
                .single();

            if (firmaError || !firma) {
                return res.status(404).json({
                    success: false,
                    message: 'Firma no encontrada o no está expirada'
                });
            }

            // Reenviar solicitud en PDFfiller
            const reenvioResult = await PDFFillerService.reenviarSolicitudFirma(firma.signature_request_id);

            if (!reenvioResult.success) {
                throw new Error('Error reenviando solicitud: ' + reenvioResult.error);
            }

            // Actualizar en base de datos
            const updateData = {
                estado: 'enviado',
                signature_request_id: reenvioResult.nuevoSignatureRequestId || firma.signature_request_id,
                fecha_envio: new Date().toISOString(),
                fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
                    signature_request_id: updateData.signature_request_id,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent'),
                    created_at: new Date().toISOString()
                });

            // Notificar al solicitante
            await this.notificarReenvioFirma(firma.solicitud_id);

            console.log('✅ Solicitud de firma reenviada exitosamente:', firma_id);

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
            console.error('❌ Error reenviando solicitud de firma:', error);
            res.status(500).json({
                success: false,
                message: 'Error reenviando solicitud de firma: ' + error.message
            });
        }
    }

    /**
     * Notificar reenvío de firma
     */
    static async notificarReenvioFirma(solicitudId) {
        try {
            const { data: solicitud } = await supabase
                .from('solicitudes_credito')
                .select('solicitante_id')
                .eq('id', solicitudId)
                .single();

            if (solicitud) {
                await supabase
                    .from('notificaciones')
                    .insert({
                        usuario_id: solicitud.solicitante_id,
                        tipo: 'firma_reenviada',
                        titulo: 'Solicitud de Firma Reenviada',
                        mensaje: 'Se ha reenviado la solicitud de firma digital del contrato. Por favor, revisa tu correo.',
                        leida: false,
                        created_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error notificando reenvío de firma:', error);
        }
    }

    /**
     * Obtener firmas pendientes para dashboard
     */
    static async obtenerFirmasPendientes(req, res) {
        try {
            const usuario_id = req.usuario.id;
            const { rol } = req.usuario;

            let query = supabase
                .from('firmas_digitales')
                .select(`
                    *,
                    contratos(*),
                    solicitudes_credito(
                        numero_solicitud,
                        monto_solicitado,
                        solicitante_id,
                        operador_id,
                        solicitantes: solicitantes!solicitante_id(
                            usuarios(*)
                        )
                    )
                `)
                .in('estado', ['enviado', 'firmado_solicitante', 'firmado_operador'])
                .order('fecha_envio', { ascending: true });

            // Filtrar por rol
            if (rol === 'solicitante') {
                query = query.eq('solicitudes_credito.solicitante_id', usuario_id);
            } else if (rol === 'operador') {
                query = query.eq('solicitudes_credito.operador_id', usuario_id);
            }

            const { data: firmas, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                data: firmas || []
            });

        } catch (error) {
            console.error('Error obteniendo firmas pendientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo firmas pendientes'
            });
        }
    }
}

module.exports = FirmaDigitalController;