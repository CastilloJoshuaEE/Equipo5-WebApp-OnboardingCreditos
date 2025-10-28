const { supabase } = require('../config/conexion');
const PDFDocument = require('pdfkit');

class TransferenciasBancariasController {

    /**
     * Verificar si está habilitada la transferencia para una solicitud
     */
    static async verificarHabilitacionTransferencia(req, res) {
        try {
            const { solicitud_id } = req.params;

            // Verificar que la firma digital esté completa
            const { data: firma, error: firmaError } = await supabase
                .from('firmas_digitales')
                .select('estado, fecha_firma_completa')
                .eq('solicitud_id', solicitud_id)
                .eq('estado', 'firmado_completo')
                .single();

            if (firmaError || !firma) {
                return res.json({
                    success: true,
                    data: {
                        habilitado: false,
                        motivo: 'Firma digital no completada'
                    }
                });
            }

            // Verificar que no exista ya una transferencia para esta solicitud
            const { data: transferenciaExistente, error: transError } = await supabase
                .from('transferencias_bancarias')
                .select('id, estado')
                .eq('solicitud_id', solicitud_id)
                .in('estado', ['pendiente', 'procesando', 'completada'])
                .single();

            if (transferenciaExistente) {
                return res.json({
                    success: true,
                    data: {
                        habilitado: false,
                        motivo: 'Ya existe una transferencia para esta solicitud',
                        transferencia_existente: transferenciaExistente
                    }
                });
            }

            res.json({
                success: true,
                data: {
                    habilitado: true,
                    fecha_firma_completa: firma.fecha_firma_completa
                }
            });

        } catch (error) {
            console.error('Error verificando habilitación de transferencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error al verificar habilitación de transferencia'
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

            // Validaciones
            if (!solicitud_id || !contacto_bancario_id || !monto) {
                return res.status(400).json({
                    success: false,
                    message: 'Solicitud ID, contacto bancario ID y monto son requeridos'
                });
            }

            // Verificar que el operador tiene permisos sobre esta solicitud
            const { data: solicitud, error: solError } = await supabase
                .from('solicitudes_credito')
                .select('operador_id, monto, moneda, estado')
                .eq('id', solicitud_id)
                .single();

            if (solError || !solicitud) {
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

            // Verificar que la firma esté completa
            const { data: firma } = await supabase
                .from('firmas_digitales')
                .select('id')
                .eq('solicitud_id', solicitud_id)
                .eq('estado', 'firmado_completo')
                .single();

            if (!firma) {
                return res.status(400).json({
                    success: false,
                    message: 'La firma digital no está completada'
                });
            }

            // Obtener información del contacto bancario
            const { data: contacto, error: contactoError } = await supabase
                .from('contactos_bancarios')
                .select('*')
                .eq('id', contacto_bancario_id)
                .single();

            if (contactoError || !contacto) {
                return res.status(404).json({
                    success: false,
                    message: 'Contacto bancario no encontrado'
                });
            }

            // Obtener contrato relacionado
            const { data: contrato, error: contratoError } = await supabase
                .from('contratos')
                .select('id')
                .eq('solicitud_id', solicitud_id)
                .single();

            if (contratoError || !contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            // Generar número de comprobante único
            const numeroComprobante = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

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
                costo_transferencia: 0, // Sin costo
                estado: 'pendiente',
                procesado_por: operador_id,
                fecha_procesamiento: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: transferencia, error } = await supabase
                .from('transferencias_bancarias')
                .insert([transferenciaData])
                .select()
                .single();

            if (error) throw error;

            // Simular procesamiento de transferencia (en un sistema real aquí iría la integración con el banco)
            setTimeout(async () => {
                await TransferenciasBancariasController.simularProcesamientoTransferencia(transferencia.id);
            }, 2000);

            res.status(201).json({
                success: true,
                message: 'Transferencia creada exitosamente',
                data: transferencia
            });

        } catch (error) {
            console.error('Error creando transferencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear transferencia'
            });
        }
    }

    /**
     * Simular procesamiento de transferencia
     */
    static async simularProcesamientoTransferencia(transferenciaId) {
        try {
            // Actualizar estado a procesando
            await supabase
                .from('transferencias_bancarias')
                .update({
                    estado: 'procesando',
                    updated_at: new Date().toISOString()
                })
                .eq('id', transferenciaId);

            // Simular delay de procesamiento bancario
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Completar transferencia
            const { data: transferencia } = await supabase
                .from('transferencias_bancarias')
                .update({
                    estado: 'completada',
                    fecha_completada: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', transferenciaId)
                .select()
                .single();

            if (transferencia) {
                // Generar comprobante PDF
                await TransferenciasBancariasController.generarComprobantePDF(transferencia);
                
                // Crear notificación
                await TransferenciasBancariasController.crearNotificacionTransferencia(transferencia);
            }

        } catch (error) {
            console.error('Error en simulación de transferencia:', error);
            
            // Marcar como fallida
            await supabase
                .from('transferencias_bancarias')
                .update({
                    estado: 'fallida',
                    updated_at: new Date().toISOString()
                })
                .eq('id', transferenciaId);
        }
    }

    /**
     * Generar comprobante PDF
     */
    static async generarComprobantePDF(transferencia) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const chunks = [];
                
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', async () => {
                    try {
                        const pdfBuffer = Buffer.concat(chunks);
                        const nombreArchivo = `comprobante-${transferencia.numero_comprobante}.pdf`;
                        const rutaStorage = `comprobantes-transferencias/${nombreArchivo}`;

                        // Subir a Supabase Storage
                        const { error: uploadError } = await supabase.storage
                            .from('kyc-documents')
                            .upload(rutaStorage, pdfBuffer, {
                                contentType: 'application/pdf',
                                upsert: true
                            });

                        if (!uploadError) {
                            // Actualizar transferencia con ruta del comprobante
                            await supabase
                                .from('transferencias_bancarias')
                                .update({
                                    ruta_comprobante: rutaStorage,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', transferencia.id);
                        }

                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });

                // Contenido del PDF
                doc.fontSize(20).text('COMPROBANTE DE TRANSFERENCIA BANCARIA', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12);
                doc.text(`Número de Comprobante: ${transferencia.numero_comprobante}`);
                doc.text(`Fecha: ${new Date(transferencia.created_at).toLocaleDateString()}`);
                doc.text(`Hora: ${new Date(transferencia.created_at).toLocaleTimeString()}`);
                doc.moveDown();
                doc.text(`Monto: ${transferencia.moneda} ${transferencia.monto.toFixed(2)}`);
                doc.text(`Cuenta Origen: ${transferencia.cuenta_origen}`);
                doc.text(`Banco Origen: ${transferencia.banco_origen}`);
                doc.text(`Cuenta Destino: ${transferencia.cuenta_destino}`);
                doc.text(`Banco Destino: ${transferencia.banco_destino}`);
                doc.moveDown();
                doc.text(`Motivo: ${transferencia.motivo || 'Transferencia de crédito aprobado'}`);
                doc.text(`Costo de Transferencia: ${transferencia.moneda} ${transferencia.costo_transferencia.toFixed(2)}`);
                doc.moveDown();
                doc.text('ESTA TRANSFERENCIA NO TIENE COSTO', { align: 'center' });
                doc.moveDown();
                doc.text('Estado: COMPLETADA', { align: 'center' });

                doc.end();

            } catch (error) {
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
                            numero_comprobante: transferencia.numero_comprobante
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
            console.error('Error creando notificación de transferencia:', error);
        }
    }

    /**
     * Obtener comprobante de transferencia
     */
    static async obtenerComprobante(req, res) {
        try {
            const { transferencia_id } = req.params;

            const { data: transferencia, error } = await supabase
                .from('transferencias_bancarias')
                .select('ruta_comprobante, numero_comprobante, estado')
                .eq('id', transferencia_id)
                .single();

            if (error || !transferencia) {
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
            res.setHeader('Content-Disposition', `attachment; filename="comprobante-${transferencia.numero_comprobante}.pdf"`);
            res.send(buffer);

        } catch (error) {
            console.error('Error obteniendo comprobante:', error);
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
            let query = supabase
                .from('transferencias_bancarias')
                .select(`
                    *,
                    solicitudes_credito (
                        numero_solicitud,
                        solicitante_id,
                        operador_id
                    ),
                    contactos_bancarios (
                        numero_cuenta,
                        nombre_banco,
                        solicitante_id
                    )
                `)
                .order('created_at', { ascending: false });

            // Filtrar por rol
            if (usuario.rol === 'solicitante') {
                query = query.eq('solicitudes_credito.solicitante_id', usuario.id);
            } else if (usuario.rol === 'operador') {
                query = query.eq('solicitudes_credito.operador_id', usuario.id);
            }

            const { data: transferencias, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                data: transferencias || []
            });

        } catch (error) {
            console.error('Error obteniendo historial de transferencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial'
            });
        }
    }
}

module.exports = TransferenciasBancariasController;