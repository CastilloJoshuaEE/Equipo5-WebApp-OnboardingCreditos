const { supabase } = require('../config/conexion');
const PDFDocument = require('pdfkit');
const TransferenciasBancariasModel = require('../modelos/TransferenciasBancariasModel');

class TransferenciasBancariasController {

     /**
     * Verificar si está habilitada la transferencia para una solicitud
     */
    static async verificarHabilitacionTransferencia(req, res) {
        try {
            const { solicitud_id } = req.params;

            console.log(`. Verificando habilitación para solicitud: ${solicitud_id}`);

            // Usar el modelo para verificar estado de firma
            const firmas = await TransferenciasBancariasModel.verificarEstadoFirma(solicitud_id);

            console.log('. Firmas encontradas:', firmas?.length || 0, firmas);

            if (!firmas || firmas.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        habilitado: false,
                        motivo: 'No se encontró proceso de firma para esta solicitud',
                        estado_actual: 'no_encontrado'
                    }
                });
            }

            // Tomar la firma más reciente
            const firma = firmas[0];
            
            // Verificación corregida - Ambas partes deben haber firmado
            const ambasPartesFirmaron = (
                firma.fecha_firma_solicitante && 
                firma.fecha_firma_operador &&
                firma.estado === 'firmado_completo'
            );

            console.log('. Resultado verificación firma .:', {
                estado: firma.estado,
                integridad_valida: firma.integridad_valida,
                tiene_firma_solicitante: !!firma.fecha_firma_solicitante,
                tiene_firma_operador: !!firma.fecha_firma_operador,
                ambas_partes_firmaron: ambasPartesFirmaron
            });

            if (!ambasPartesFirmaron) {
                return res.json({
                    success: true,
                    data: {
                        habilitado: false,
                        motivo: `Firma digital incompleta. Estado: ${firma.estado || 'no definido'}`,
                        estado_actual: firma.estado || 'no_encontrada',
                        integridad_valida: firma.integridad_valida,
                        tiene_firma_solicitante: !!firma.fecha_firma_solicitante,
                        tiene_firma_operador: !!firma.fecha_firma_operador,
                        detalles_firma: firma
                    }
                });
            }

            // Verificar que no exista ya una transferencia usando el modelo
               const transferenciaExistente = await 
      TransferenciasBancariasModel.verificarTransferenciaExistente(solicitud_id);

    if (transferenciaExistente) {
      return res.json({
        success: true,
        data: {
          habilitado: false,
          existe_transferencia: true, // ← ESTE CAMPO ES CRÍTICO
          motivo: 'Ya existe una transferencia para esta solicitud',
          transferencia_existente: transferenciaExistente
        }
      });
    }

            // Habilitado - Ambas partes firmaron correctamente
            console.log(`. Transferencia HABILITADA para solicitud: ${solicitud_id} - Ambas partes firmaron`);
            
            res.json({
                success: true,
                data: {
                    habilitado: true,
                    fecha_firma_completa: firma.fecha_firma_completa,
                    estado_firma: firma.estado,
                    integridad_valida: firma.integridad_valida,
                    motivo: 'Firma digital completada correctamente por ambas partes',
                    detalles_completos: firma
                }
            });

        } catch (error) {
            console.error('. Error verificando habilitación de transferencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar habilitación de transferencia',
                error: error.message
            });
        }
    }
   /**
     * Crear nueva transferencia bancaria
     */
    static async crearTransferencia(req, res) {
        try {
            const {
                solicitud_id,
                contacto_bancario_id,
                monto,
                moneda = 'USD',
                motivo
            } = req.body;

            const operador_id = req.usuario.id;

            console.log('. Iniciando creación de transferencia:', {
                solicitud_id,
                contacto_bancario_id,
                monto,
                operador_id
            });

            // Validaciones
            if (!solicitud_id || !contacto_bancario_id || !monto) {
                return res.status(400).json({
                    success: false,
                    message: 'Solicitud ID, contacto bancario ID y monto son requeridos'
                });
            }

            // Verificar que el operador tiene permisos sobre esta solicitud usando el modelo
            const solicitud = await TransferenciasBancariasModel.obtenerSolicitud(solicitud_id);
            if (!solicitud) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitud no encontrada'
                });
            }

            if (solicitud.operador_id !== operador_id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar transferencias en esta solicitud'
                });
            }

            // Verificación de firma digital usando el modelo
            const firmas = await TransferenciasBancariasModel.verificarEstadoFirma(solicitud_id);
            if (!firmas || firmas.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se encontró proceso de firma para esta solicitud'
                });
            }

            const firma = firmas[0];
            const ambasPartesFirmaron = 
                firma.fecha_firma_solicitante && 
                firma.fecha_firma_operador && 
                firma.estado === 'firmado_completo';

            if (!ambasPartesFirmaron) {
                return res.status(400).json({
                    success: false,
                    message: `Firma digital incompleta. Estado: ${firma.estado || 'no definido'}`,
                    detalles: {
                        tiene_firma_solicitante: !!firma.fecha_firma_solicitante,
                        tiene_firma_operador: !!firma.fecha_firma_operador,
                        estado_firma: firma.estado
                    }
                });
            }

            // Obtener información del contacto bancario usando el modelo
            const contacto = await TransferenciasBancariasModel.obtenerContactoBancario(contacto_bancario_id);
            if (!contacto) {
                return res.status(404).json({
                    success: false,
                    message: 'Contacto bancario no encontrado'
                });
            }

            // Verificar relación contacto-solicitante
            console.log('🔍 Verificando relación contacto-solicitante:', {
                contacto_solicitante_id: contacto.solicitante_id,
                solicitud_solicitante_id: solicitud.solicitante_id
            });

            if (!contacto.solicitante_id || contacto.solicitante_id !== solicitud.solicitante_id) {
                return res.status(400).json({
                    success: false,
                    message: 'El contacto bancario no pertenece al solicitante de esta solicitud',
                    detalles: {
                        contacto_solicitante_id: contacto.solicitante_id,
                        solicitud_solicitante_id: solicitud.solicitante_id
                    }
                });
            }

            // Obtener contrato relacionado usando el modelo
            const contrato = await TransferenciasBancariasModel.obtenerContrato(solicitud_id);
            if (!contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            // Generar número de comprobante único usando el modelo
            const numero_comprobante = TransferenciasBancariasModel.generarNumeroComprobante();

            const transferenciaData = {
                solicitud_id,
                contrato_id: contrato.id,
                contacto_bancario_id,
                monto: parseFloat(monto),
                moneda,
                numero_comprobante,
                cuenta_destino: contacto.numero_cuenta,
                banco_destino: contacto.nombre_banco,
                motivo,
                costo_transferencia: 0,
                estado: 'pendiente',
                procesado_por: operador_id,
                fecha_procesamiento: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Validar datos usando el modelo
            TransferenciasBancariasModel.validarDatosTransferencia(transferenciaData);

            console.log('📝 Insertando transferencia:', transferenciaData);

            // Crear transferencia usando el modelo
            const transferencia = await TransferenciasBancariasModel.crear(transferenciaData);

            console.log('. Transferencia creada exitosamente:', transferencia.id);

            // Simular procesamiento de transferencia
            setTimeout(async () => {
                try {
                    await TransferenciasBancariasController.simularProcesamientoTransferencia(transferencia.id);
                } catch (simError) {
                    console.error('. Error en procesamiento simulado:', simError);
                }
            }, 2000);

            res.status(201).json({
                success: true,
                message: 'Transferencia creada exitosamente',
                data: transferencia
            });

        } catch (error) {
            console.error('. Error crítico creando transferencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear transferencia',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }


    static async enviarNotificacionesPago(transferencia) {
        try {
            // Obtener información completa de la transferencia
            const { data: transferenciaCompleta, error } = await supabase
                .from('transferencias_bancarias')
                .select(`
                    *,
                    solicitudes_credito (
                        numero_solicitud,
                        solicitante_id,
                        operador_id,
                        monto,
                        moneda,
                        solicitantes: solicitante_id (
                            usuarios (*)
                        )
                    ),
                    contactos_bancarios (*)
                `)
                .eq('id', transferencia.id)
                .single();

            if (error) throw error;

            const solicitud = transferenciaCompleta.solicitudes_credito;
            const solicitante = solicitud.solicitantes.usuarios;
            const contacto = transferenciaCompleta.contactos_bancarios;

            // CORRECCIÓN: Usar transferenciaCompleta en lugar de transferencia para asegurar que tenga numero_comprobante
            const numeroComprobante = transferenciaCompleta.numero_comprobante || transferencia.numero_comprobante || 'N/A';
        const comprobanteBuffer = await TransferenciasBancariasController.generarComprobantePDF(transferenciaCompleta);

            // 1. NOTIFICACIÓN INTERNA AL SOLICITANTE
            const notificacionSolicitante = {
                usuario_id: solicitud.solicitante_id,
                solicitud_id: transferencia.solicitud_id,
                tipo: 'transferencia_completada',
                titulo: 'Transferencia Completada .',
                mensaje: `Se ha completado la transferencia de ${transferenciaCompleta.moneda} ${transferenciaCompleta.monto} a tu cuenta ${contacto.numero_cuenta} en ${contacto.nombre_banco}.`,
                datos_adicionales: {
                    transferencia_id: transferenciaCompleta.id,
                    monto: transferenciaCompleta.monto,
                    moneda: transferenciaCompleta.moneda,
                    numero_comprobante: numeroComprobante,
                    cuenta_destino: contacto.numero_cuenta,
                    banco_destino: contacto.nombre_banco
                },
                leida: false,
                created_at: new Date().toISOString()
            };

            // 2. NOTIFICACIÓN AL OPERADOR
            const notificacionOperador = {
                usuario_id: solicitud.operador_id,
                solicitud_id: transferencia.solicitud_id,
                tipo: 'transferencia_procesada',
                titulo: 'Transferencia Procesada .',
                mensaje: `Transferencia de ${transferenciaCompleta.moneda} ${transferenciaCompleta.monto} procesada exitosamente para la solicitud ${solicitud.numero_solicitud}.`,
                datos_adicionales: {
                    transferencia_id: transferenciaCompleta.id,
                    monto: transferenciaCompleta.monto,
                    moneda: transferenciaCompleta.moneda,
                    numero_comprobante: numeroComprobante,
                    solicitante_nombre: solicitante.nombre_completo
                },
                leida: false,
                created_at: new Date().toISOString()
            };

            await supabase
                .from('notificaciones')
                .insert([notificacionSolicitante, notificacionOperador]);

            // 3. EMAIL AL SOLICITANTE
            await TransferenciasBancariasController.enviarEmailComprobanteSolicitante(
                solicitante.email,
                solicitante.nombre_completo,
                transferenciaCompleta,
                comprobanteBuffer
            );

            // 4. EMAIL AL OPERADOR (opcional)
            await TransferenciasBancariasController.enviarEmailConfirmacionOperador(
                solicitud.operador_id,
                transferenciaCompleta
            );

            console.log('. Notificaciones de pago enviadas exitosamente');

        } catch (error) {
            console.error('. Error enviando notificaciones de pago:', error);
        }
    }
    static async marcarSolicitudComoCerrada(solicitudId) {
    try {
        const { error } = await supabase
            .from('solicitudes_credito')
            .update({
                estado: 'aprobada',
                updated_at: new Date().toISOString()
            })
            .eq('id', solicitudId);

        if (error) throw error;

        console.log(`. Solicitud ${solicitudId} marcada como cerrada`);

        // También actualizar el contrato
        await supabase
            .from('contratos')
            .update({
                estado: 'cerrado',
                updated_at: new Date().toISOString()
            })
            .eq('solicitud_id', solicitudId);

    } catch (error) {
        console.error('. Error marcando solicitud como cerrada:', error);
        throw error;
    }
}
static async enviarEmailComprobanteSolicitante(email, nombre, transferencia, comprobanteBuffer) {
    try {
        const { enviarEmail } = require('../servicios/emailServicio');
        
        const numeroComprobante = transferencia.numero_comprobante || 'N/A';
        const asunto = `Comprobante de Transferencia - ${numeroComprobante}`;
        
        const mensaje = `
            Hola ${nombre},

            Nos complace informarte que se ha completado la transferencia de tu crédito aprobado.

            . DETALLES DE LA TRANSFERENCIA:
            • Monto: ${transferencia.moneda} ${transferencia.monto}
            • Número de comprobante: ${numeroComprobante}
            • Cuenta destino: ${transferencia.contactos_bancarios?.numero_cuenta || 'N/A'}
            • Banco destino: ${transferencia.contactos_bancarios?.nombre_banco || 'N/A'}
            • Fecha de procesamiento: ${new Date(transferencia.fecha_completada || transferencia.created_at).toLocaleDateString()}

            Se adjunta el comprobante de transferencia en formato PDF.

            Saludos cordiales,
            Equipo de Créditos Pyme
        `;

        // PREPARAR ADJUNTO CORRECTAMENTE
        const attachments = [];
        if (comprobanteBuffer) {
            attachments.push({
                filename: `comprobante-${numeroComprobante}.pdf`,
                content: comprobanteBuffer, // Buffer que se convertirá a base64
                contentType: 'application/pdf'
            });
        }

        const resultado = await enviarEmail({
            to: email,
            subject: asunto,
            text: mensaje,
            html: mensaje.replace(/\n/g, '<br>'),
            attachments: attachments
        });
        
        if (resultado.success) {
            console.log('. Email con comprobante enviado al solicitante:', email);
        } else {
            console.error('. Error enviando email al solicitante:', resultado.error);
        }
        
        return resultado;

    } catch (error) {
        console.error('. Error enviando email con comprobante:', error);
        throw error;
    }
}
static async enviarEmailConfirmacionOperador(email, nombre, transferencia, comprobanteBuffer) {
    try {
        const { enviarEmail } = require('../servicios/emailServicio');
        
        const numeroComprobante = transferencia.numero_comprobante || 'N/A';
        const asunto = `Confirmación de Transferencia Procesada - ${numeroComprobante}`;
        
        const mensaje = `
            Hola ${nombre},

            Se ha procesado exitosamente la transferencia de crédito.

            . DETALLES DE LA TRANSFERENCIA:
            • Solicitud: ${transferencia.solicitudes_credito?.numero_solicitud || 'N/A'}
            • Monto: ${transferencia.moneda} ${transferencia.monto}
            • Número de comprobante: ${numeroComprobante}
            • Cuenta destino: ${transferencia.contactos_bancarios?.numero_cuenta || 'N/A'}
            • Banco destino: ${transferencia.contactos_bancarios?.nombre_banco || 'N/A'}
            • Solicitante: ${transferencia.solicitudes_credito?.solicitantes?.usuarios?.nombre_completo || 'N/A'}
            • Fecha de procesamiento: ${new Date(transferencia.fecha_completada || transferencia.created_at).toLocaleDateString()}

            La transferencia ha sido marcada como COMPLETADA en el sistema.

            Se adjunta el comprobante para tus registros.
        `;

        // PREPARAR ADJUNTO CORRECTAMENTE
        const attachments = [];
        if (comprobanteBuffer) {
            attachments.push({
                filename: `comprobante-${numeroComprobante}.pdf`,
                content: comprobanteBuffer,
                contentType: 'application/pdf'
            });
        }

        const resultado = await enviarEmail({
            to: email,
            subject: asunto,
            text: mensaje,
            html: mensaje.replace(/\n/g, '<br>'),
            attachments: attachments
        });

        if (resultado.success) {
            console.log('. Email de confirmación enviado al operador:', email);
        } else {
            console.error('. Error enviando email al operador:', resultado.error);
        }

        return resultado;

    } catch (error) {
        console.error('. Error enviando email al operador:', error);
        throw error;
    }
}
    /**
     * Simular procesamiento de transferencia
     */
    static async simularProcesamientoTransferencia(transferenciaId) {
        try {
            // Actualizar estado a procesando usando el modelo
            await TransferenciasBancariasModel.actualizarEstado(transferenciaId, 'procesando');

            // Simular delay de procesamiento bancario
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Completar transferencia usando el modelo
            const transferencia = await TransferenciasBancariasModel.actualizarEstado(
                transferenciaId, 
                'completada',
                { fecha_completada: new Date().toISOString() }
            );

            if (transferencia) {
                // Generar comprobante PDF
                await TransferenciasBancariasController.generarComprobantePDF(transferencia);
                try {
                    await TransferenciasBancariasController.enviarNotificacionesCompletas(transferencia);
                    console.log('. Notificaciones y emails enviados exitosamente');
                } catch (notifError) {
                    console.error('. Error en notificaciones (continuando proceso):', notifError);
                }
            }

        } catch (error) {
            console.error('. Error en simulación de transferencia:', error);
            // Marcar como fallida usando el modelo
            await TransferenciasBancariasModel.actualizarEstado(transferenciaId, 'fallida');
        }
    }
    /**
     * Generar comprobante PDF
     */
    static async generarComprobantePDF(transferencia) {
        return new Promise((resolve, reject) => {
            try {
                console.log('📄 Generando comprobante PDF para transferencia:', transferencia.id);
                
                const doc = new PDFDocument();
                const chunks = [];
                
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', async () => {
                    try {
                        const pdfBuffer = Buffer.concat(chunks);
                        
                        const numeroComprobante = transferencia.numero_comprobante || `TRF-${transferencia.id}`;
                        const nombreArchivo = `comprobante-${numeroComprobante}.pdf`;
                        const rutaStorage = `comprobantes-transferencias/${nombreArchivo}`;

                        console.log('💾 Subiendo comprobante a storage:', rutaStorage);

                        // Subir a Supabase Storage
                        const { error: uploadError } = await supabase.storage
                            .from('kyc-documents')
                            .upload(rutaStorage, pdfBuffer, {
                                contentType: 'application/pdf',
                                upsert: true
                            });

                        if (uploadError) {
                            console.error('. Error subiendo comprobante:', uploadError);
                            reject(uploadError);
                            return;
                        }

                        // Actualizar transferencia con ruta del comprobante usando el modelo
                        await TransferenciasBancariasModel.actualizarRutaComprobante(transferencia.id, rutaStorage);

                        console.log('. Comprobante PDF generado y guardado exitosamente:', rutaStorage);
                        resolve(pdfBuffer);

                    } catch (error) {
                        console.error('. Error en generación de PDF:', error);
                        reject(error);
                    }
                });

                // Contenido del PDF (mejorado)
                const numeroComprobante = transferencia.numero_comprobante || `TRF-${transferencia.id}`;
                
                doc.fontSize(20).text('COMPROBANTE DE TRANSFERENCIA BANCARIA', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12);
                doc.text(`Número de Comprobante: ${numeroComprobante}`);
                doc.text(`Fecha: ${new Date(transferencia.created_at).toLocaleDateString()}`);
                doc.text(`Hora: ${new Date(transferencia.created_at).toLocaleTimeString()}`);
                doc.moveDown();
                doc.text(`Monto Transferido: ${transferencia.moneda} ${transferencia.monto.toFixed(2)}`);
                doc.text(`Cuenta Origen: ${transferencia.cuenta_origen || 'Nexia-001-USD'}`);
                doc.text(`Banco Origen: ${transferencia.banco_origen || 'Nexia Bank'}`);
                doc.text(`Cuenta Destino: ${transferencia.cuenta_destino}`);
                doc.text(`Banco Destino: ${transferencia.banco_destino}`);
                doc.moveDown();
                doc.text(`Motivo: ${transferencia.motivo || 'Transferencia de crédito aprobado'}`);
                doc.text(`Estado: COMPLETADA`);
                doc.moveDown();
                doc.text('ESTA TRANSFERENCIA NO TIENE COSTO', { align: 'center' });
                doc.moveDown();
                doc.text('Documento generado automáticamente por el Sistema de Créditos de Nexia', 
                        { align: 'center', fontSize: 10 });

                doc.end();

            } catch (error) {
                console.error('. Error crítico generando PDF:', error);
                reject(error);
            }
        });
    }

    /**
     * Crear notificación de transferencia
     */
    static async crearNotificacionTransferencia(transferencia) {
        try {
            // Obtener información de la solicitud
            const { data: solicitud } = await supabase
                .from('solicitudes_credito')
                .select('solicitante_id, operador_id')
                .eq('id', transferencia.solicitud_id)
                .single();

            if (solicitud) {
                // CORRECCIÓN: Verificar que transferencia.numero_comprobante existe
                const numeroComprobante = transferencia.numero_comprobante || 'N/A';

                const notificaciones = [
                    {
                        usuario_id: solicitud.solicitante_id,
                        solicitud_id: transferencia.solicitud_id,
                        tipo: 'transferencia_completada',
                        titulo: 'Transferencia Completada',
                        mensaje: `Se ha completado la transferencia de ${transferencia.moneda} ${transferencia.monto} a tu cuenta bancaria.`,
                        datos_adicionales: {
                            transferencia_id: transferencia.id,
                            monto: transferencia.monto,
                            moneda: transferencia.moneda,
                            numero_comprobante: numeroComprobante
                        },
                        leida: false,
                        created_at: new Date().toISOString()
                    },
                    {
                        usuario_id: solicitud.operador_id,
                        solicitud_id: transferencia.solicitud_id,
                        tipo: 'transferencia_completada',
                        titulo: 'Transferencia Completada',
                        mensaje: `Transferencia de ${transferencia.moneda} ${transferencia.monto} completada exitosamente.`,
                        datos_adicionales: {
                            transferencia_id: transferencia.id,
                            monto: transferencia.monto,
                            moneda: transferencia.moneda
                        },
                        leida: false,
                        created_at: new Date().toISOString()
                    }
                ];

                await supabase
                    .from('notificaciones')
                    .insert(notificaciones);
            }

        } catch (error) {
            console.error('. Error creando notificación de transferencia:', error);
        }
    }

 
    /**
     * Obtener comprobante de transferencia
     */
    static async obtenerComprobante(req, res) {
        try {
            const { transferencia_id } = req.params;

            // Verificar permisos usando el modelo
            const tienePermisos = await TransferenciasBancariasModel.verificarPermisos(
                transferencia_id, 
                req.usuario.id, 
                req.usuario.rol
            );

            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para acceder a este comprobante'
                });
            }

            const transferencia = await TransferenciasBancariasModel.obtenerInfoComprobante(transferencia_id);

            if (!transferencia) {
                return res.status(404).json({
                    success: false,
                    message: 'Transferencia no encontrada'
                });
            }

            if (!transferencia.ruta_comprobante) {
                return res.status(404).json({
                    success: false,
                    message: 'Comprobante no generado aún'
                });
            }

            if (transferencia.estado !== 'completada') {
                return res.status(400).json({
                    success: false,
                    message: 'La transferencia no está completada'
                });
            }

            // Descargar archivo
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('kyc-documents')
                .download(transferencia.ruta_comprobante);

            if (downloadError) {
                throw new Error('Error descargando comprobante');
            }

            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="comprobante-${transferencia.numero_comprobante || transferencia_id}.pdf"`);
            res.send(buffer);

        } catch (error) {
            console.error('. Error obteniendo comprobante:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener comprobante'
            });
        }
    }
    /**
     * Obtener historial de transferencias
     */
    static async obtenerHistorial(req, res) {
        try {
            const usuario = req.usuario;

            const transferencias = await TransferenciasBancariasModel.obtenerHistorialPorUsuario(
                usuario.id, 
                usuario.rol
            );

            res.json({
                success: true,
                data: transferencias || []
            });

        } catch (error) {
            console.error('. Error obteniendo historial de transferencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial'
            });
        }
    }


    /**
     * Forzar actualización de estado de firma y verificar transferencia
     */
    static async forzarActualizacionEstado(req, res) {
        try {
            const { solicitud_id } = req.params;
            const usuario = req.usuario;

            console.log(`🔄 Forzando actualización para solicitud: ${solicitud_id} por usuario: ${usuario.id}`);

            // CONSULTA .: Tomar la firma más reciente
            const { data: firmas, error: firmaError } = await supabase
                .from('firmas_digitales')
                .select('*')
                .eq('solicitud_id', solicitud_id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (firmaError) {
                console.error('. Error en consulta de firma:', firmaError);
                return res.status(500).json({
                    success: false,
                    message: 'Error al consultar firma digital'
                });
            }

            if (!firmas || firmas.length === 0) {
                console.log(`. No se encontró proceso de firma para: ${solicitud_id}`);
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró proceso de firma para esta solicitud'
                });
            }

            const firmaActual = firmas[0];
            console.log(`. Estado actual de firma: ${firmaActual.estado}, Integridad: ${firmaActual.integridad_valida}`);

            // VERIFICACIÓN CORREGIDA - Ambas partes deben haber firmado
            let ambasPartesFirmaron = false;
            let motivo = '';

            if (firmaActual.estado === 'firmado_completo' && 
                firmaActual.fecha_firma_solicitante && 
                firmaActual.fecha_firma_operador) {
                ambasPartesFirmaron = true;
                motivo = 'Ambas partes han firmado correctamente';
            } else {
                motivo = `Firma incompleta. Estado: ${firmaActual.estado}, Solicitante: ${!!firmaActual.fecha_firma_solicitante}, Operador: ${!!firmaActual.fecha_firma_operador}`;
            }

            // Verificar si hay transferencia existente
            const { data: transferenciaExistente } = await supabase
                .from('transferencias_bancarias')
                .select('id, estado')
                .eq('solicitud_id', solicitud_id)
                .in('estado', ['pendiente', 'procesando', 'completada'])
                .maybeSingle();

            const habilitado = ambasPartesFirmaron && !transferenciaExistente;

            console.log(`🎯 Resultado final - Habilitado: ${habilitado}, Motivo: ${motivo}`);

            res.json({
                success: true,
                data: {
                    habilitado,
                    estado_firma: firmaActual.estado,
                    integridad_valida: firmaActual.integridad_valida,
                    firma_id: firmaActual.id,
                    existe_transferencia: !!transferenciaExistente,
                    transferencia_existente: transferenciaExistente,
                    motivo: habilitado ? 'Firma completada correctamente por ambas partes' : motivo,
                    detalles: {
                        tiene_firma_solicitante: !!firmaActual.fecha_firma_solicitante,
                        tiene_firma_operador: !!firmaActual.fecha_firma_operador,
                        fecha_firma_completa: firmaActual.fecha_firma_completa,
                        datos_completos_firma: firmaActual
                    }
                }
            });

        } catch (error) {
            console.error('. Error forzando actualización:', error);
            res.status(500).json({
                success: false,
                message: 'Error forzando actualización: ' + error.message
            });
        }
    }
   /**
 * Enviar notificaciones completas - .
 */
static async enviarNotificacionesCompletas(transferencia) {
    try {
        console.log('. Iniciando envío de notificaciones completas para transferencia:', transferencia.id);

        // CORRECCIÓN: Usar transferencia.solicitud_id en lugar de solicitud_id no definida
        const solicitud_id = transferencia.solicitud_id;

        // 1. Notificaciones internas
        await TransferenciasBancariasController.crearNotificacionesInternas(transferencia);
        
        // 2. Emails con comprobante
        await TransferenciasBancariasController.enviarEmailsConComprobante(transferencia);
        
        // CORRECCIÓN: Pasar el parámetro correcto
      //  await TransferenciasBancariasController.marcarSolicitudComoCerrada(solicitud_id);
        
        console.log('. Notificaciones completas enviadas exitosamente');

    } catch (error) {
        console.error('. Error enviando notificaciones completas:', error);
        throw error; // Propagar el error para mejor debugging
    }
}
static async crearNotificacionesInternas(transferencia) {
    try {
        // Obtener información completa
        const { data: transferenciaCompleta, error } = await supabase
            .from('transferencias_bancarias')
            .select(`
                *,
                solicitudes_credito (
                    numero_solicitud,
                    solicitante_id,
                    operador_id,
                    monto,
                    moneda,
                    solicitantes: solicitante_id (
                        usuarios (*)
                    )
                ),
                contactos_bancarios (*)
            `)
            .eq('id', transferencia.id)
            .single();

        if (error) throw error;

        const solicitud = transferenciaCompleta.solicitudes_credito;
        const solicitante = solicitud.solicitantes.usuarios;
        const contacto = transferenciaCompleta.contactos_bancarios;

        const numeroComprobante = transferenciaCompleta.numero_comprobante || 'N/A';

        console.log('. Creando notificaciones internas para:', {
            solicitante_id: solicitud.solicitante_id,
            operador_id: solicitud.operador_id
        });

        // Notificación para SOLICITANTE
        const notificacionSolicitante = {
            usuario_id: solicitud.solicitante_id,
            solicitud_id: transferencia.solicitud_id,
            tipo: 'transferencia_completada',
            titulo: 'Transferencia Completada .',
            mensaje: `Se ha completado la transferencia de ${transferenciaCompleta.moneda} ${transferenciaCompleta.monto} a tu cuenta ${contacto.numero_cuenta} en ${contacto.nombre_banco}. Nº de comprobante: ${numeroComprobante}`,
            datos_adicionales: {
                transferencia_id: transferenciaCompleta.id,
                monto: transferenciaCompleta.monto,
                moneda: transferenciaCompleta.moneda,
                numero_comprobante: numeroComprobante,
                cuenta_destino: contacto.numero_cuenta,
                banco_destino: contacto.nombre_banco,
                fecha_completada: transferenciaCompleta.fecha_completada
            },
            leida: false,
            created_at: new Date().toISOString()
        };

        // Notificación para OPERADOR
        const notificacionOperador = {
            usuario_id: solicitud.operador_id,
            solicitud_id: transferencia.solicitud_id,
            tipo: 'transferencia_procesada',
            titulo: 'Transferencia Procesada .',
            mensaje: `Transferencia de ${transferenciaCompleta.moneda} ${transferenciaCompleta.monto} procesada exitosamente para la solicitud ${solicitud.numero_solicitud}. Comprobante: ${numeroComprobante}`,
            datos_adicionales: {
                transferencia_id: transferenciaCompleta.id,
                monto: transferenciaCompleta.monto,
                moneda: transferenciaCompleta.moneda,
                numero_comprobante: numeroComprobante,
                solicitante_nombre: solicitante.nombre_completo,
                cuenta_destino: contacto.numero_cuenta
            },
            leida: false,
            created_at: new Date().toISOString()
        };

        // Insertar notificaciones
        const { error: notifError } = await supabase
            .from('notificaciones')
            .insert([notificacionSolicitante, notificacionOperador]);

        if (notifError) {
            console.error('. Error insertando notificaciones:', notifError);
            throw notifError;
        }

        console.log('📨 Notificaciones internas creadas exitosamente');

    } catch (error) {
        console.error('. Error creando notificaciones internas:', error);
        throw error;
    }
}
static async enviarEmailsConComprobante(transferencia) {
    try {
        console.log('. Preparando envío de emails con comprobante...');

        // Obtener información completa
        const { data: transferenciaCompleta, error } = await supabase
            .from('transferencias_bancarias')
            .select(`
                *,
                solicitudes_credito (
                    numero_solicitud,
                    solicitante_id,
                    operador_id,
                    monto,
                    moneda,
                    solicitantes: solicitante_id (
                        usuarios (*)
                    ),
                    operadores: operador_id (
                        usuarios (*)
                    )
                ),
                contactos_bancarios (*)
            `)
            .eq('id', transferencia.id)
            .single();

        if (error) throw error;

        const solicitud = transferenciaCompleta.solicitudes_credito;
        const solicitante = solicitud.solicitantes?.usuarios;
        const operador = solicitud.operadores?.usuarios;
        const contacto = transferenciaCompleta.contactos_bancarios;

        // Obtener el comprobante PDF
        let comprobanteBuffer = null;
        if (transferenciaCompleta.ruta_comprobante) {
            try {
                const { data: fileData, error: downloadError } = await supabase.storage
                    .from('kyc-documents')
                    .download(transferenciaCompleta.ruta_comprobante);

                if (!downloadError && fileData) {
                    const arrayBuffer = await fileData.arrayBuffer();
                    comprobanteBuffer = Buffer.from(arrayBuffer);
                    console.log('📄 Comprobante PDF obtenido para envío');
                }
            } catch (pdfError) {
                console.warn('. No se pudo obtener el comprobante PDF:', pdfError.message);
            }
        }

        // CORRECCIÓN: Validar y enviar emails de forma segura
        const emailsEnviados = [];

        // Enviar email al SOLICITANTE
        if (solicitante && solicitante.email) {
            console.log('. Enviando email a solicitante:', solicitante.email);
            try {
                const resultado = await TransferenciasBancariasController.enviarEmailComprobanteSolicitante(
                    solicitante.email, // CORRECCIÓN: Pasar solo el email, no el objeto
                    solicitante.nombre_completo,
                    transferenciaCompleta,
                    comprobanteBuffer
                );
                emailsEnviados.push({ tipo: 'solicitante', email: solicitante.email, resultado });
            } catch (error) {
                console.error('. Error enviando email al solicitante:', error);
            }
        }

        // Enviar email al OPERADOR
        if (operador && operador.email) {
            console.log('. Enviando email a operador:', operador.email);
            try {
                const resultado = await TransferenciasBancariasController.enviarEmailConfirmacionOperador(
                    operador.email, // CORRECCIÓN: Pasar solo el email
                    operador.nombre_completo,
                    transferenciaCompleta,
                    comprobanteBuffer
                );
                emailsEnviados.push({ tipo: 'operador', email: operador.email, resultado });
            } catch (error) {
                console.error('. Error enviando email al operador:', error);
            }
        }

        console.log('. Emails con comprobante procesados:', emailsEnviados.length);
        return emailsEnviados;

    } catch (error) {
        console.error('. Error enviando emails con comprobante:', error);
        throw error;
    }
}
   /**
     * Obtener mis transferencias (para solicitante)
     */
    static async obtenerMisTransferencias(req, res) {
        try {
            const usuario_id = req.usuario.id;
            const usuario_rol = req.usuario.rol;

            console.log(`. Obteniendo transferencias para: ${usuario_id} (${usuario_rol})`);

            // Solo el solicitante puede ver sus propias transferencias
            if (usuario_rol !== 'solicitante') {
                return res.status(403).json({
                    success: false,
                    message: 'No autorizado para ver estas transferencias'
                });
            }

            const transferencias = await TransferenciasBancariasModel.obtenerTransferenciasSolicitante(usuario_id);

            res.json({
                success: true,
                data: transferencias || []
            });

        } catch (error) {
            console.error('Error obteniendo transferencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener transferencias',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtener estadísticas de transferencias
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const usuario_id = req.usuario.id;
            const usuario_rol = req.usuario.rol;

            const estadisticas = await TransferenciasBancariasModel.obtenerEstadisticas(usuario_id, usuario_rol);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('. Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas'
            });
        }
    }

}

module.exports = TransferenciasBancariasController;