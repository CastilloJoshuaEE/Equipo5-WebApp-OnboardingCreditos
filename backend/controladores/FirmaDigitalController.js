// controladores/FirmaDigitalController.js
const axios = require('axios');
const crypto = require('crypto');
const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const NotificacionesController = require('./NotificacionesController');
const NotificacionService = require('../servicios/NotificacionService');
const WordService = require('../servicios/WordService');
const ContratoController = require('../controladores/ContratoController');
class FirmaDigitalController {

  /**
   * Generar hash único para documento
   */
  static generarHashDocumento(buffer, metadatos = {}) {
    const contenido = buffer.toString('base64') + JSON.stringify(metadatos);
    return crypto.createHash('sha256').update(contenido).digest('hex');
  }

  /**
   * Validar integridad del documento
   */
  static validarIntegridadDocumento(hashOriginal, hashFirmado) {
    return hashOriginal === hashFirmado;
  }
    /** 
 * Iniciar proceso de firma digital automático (sin response HTTP) 
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

      // Verificar si ya existe un proceso de firma activo
      const { data: firmaExistente } = await supabase
          .from('firmas_digitales')
          .select('id, estado, fecha_expiracion')
          .eq('solicitud_id', solicitud_id)
          .in('estado', ['pendiente', 'enviado', 'firmado_solicitante', 'firmado_operador'])
          .single();

      if (firmaExistente) {
          console.log('. Ya existe proceso de firma:', firmaExistente);
          
          // Si la firma existe pero está expirada, permitir reiniciar
          if (firmaExistente.fecha_expiracion && new Date(firmaExistente.fecha_expiracion) < new Date()) {
              console.log('. Proceso de firma expirado, permitiendo reinicio...');
              
              // Marcar como expirado
              await supabase
                  .from('firmas_digitales')
                  .update({ 
                      estado: 'expirado',
                      updated_at: new Date().toISOString()
                  })
                  .eq('id', firmaExistente.id);
          } else {
              // Si no está expirado, verificar si podemos permitir reinicio
              const puedeReiniciar = await FirmaDigitalController.verificarPuedeReiniciarFirma(firmaExistente);
              
              if (!puedeReiniciar) {
                  return res.status(400).json({
                      success: false,
                      message: 'Ya existe un proceso de firma en curso para esta solicitud',
                      data: {
                          firma_existente: firmaExistente,
                          puede_reintentar: false
                      }
                  });
              }
              
              console.log('. Permitiendo reinicio del proceso de firma existente');
          }
      }

      // Procesar el buffer del PDF
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

      // CORRECCIÓN: Usar WordService correctamente
      const uploadResult = await WordService.subirDocumento(
        `contrato-${solicitud.numero_solicitud}-${Date.now()}.docx`,
        buffer,
        metadatosDocumento
      );
      if (!uploadResult.success) {
        throw new Error('Error subiendo documento: ' + uploadResult.error);
      }
      
      const contratoId = contrato.id;
      // Crear solicitud de firma múltiple
      const firmaResult = await FirmaDigitalController.crearSolicitudFirmaMultiple(
        contratoId,
        solicitante,
        operador
      );

      if (!firmaResult.success) {
        // Fallback: intentar firma individual para solicitante
        console.log('. Fallback a firma individual para solicitante');
        const firmaIndividualResult = await FirmaDigitalController.crearSolicitudFirmaIndividual(
          uploadResult.contratoId,
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
        ruta_documento: uploadResult.ruta,
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

      // CORRECCIÓN: Usar NotificacionService en lugar de variable no definida
      await NotificacionesController.crearNotificacionesFirma(solicitante.id, operador.id, solicitud_id, firma);

      console.log('. Proceso de firma digital automático iniciado exitosamente:', {
        firmaId: firma.id,
        signatureRequestId: firmaResult.signatureRequestId
      });

      return {
        success: true,
        firma: firma,
        urls_firma: firmaResult.urlsFirma
      };

    } catch (error) {
      console.error('. Error en proceso de firma digital automático:', error);

      // CORRECCIÓN: Usar NotificacionService correctamente
      await NotificacionService.notificarErrorFirmaDigital(usuario.id, solicitud_id, error);

      throw error;
    }
  }
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

        // 2. VERIFICAR Y CREAR CONTRATO SI NO EXISTE - CORRECCIÓN CRÍTICA
        let contratoFinal;
        const { data: contratoExistente, error: contratoError } = await supabase
            .from('contratos')
            .select('*')
            .eq('solicitud_id', solicitud_id)
            .single();

        if (contratoError || !contratoExistente) {
            console.log('. No existe contrato, generando uno nuevo...');
            
            // Generar contrato usando el método mejorado
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
            contratoFinal = contratoExistente;
            console.log('. . Contrato existente encontrado:', contratoFinal.id);
        }

        // 3. VERIFICAR CRÍTICAMENTE QUE EL CONTRATO TIENE DOCUMENTO
        if (!contratoFinal.ruta_documento) {
            console.log('. . Contrato sin documento, generando Word...');
            try {
                // Generar Word del contrato con datos completos
                await ContratoController.generarWordContrato(contratoFinal.id, solicitud);
                console.log('. . Word del contrato generado');
                
                // Reconsultar para obtener la ruta actualizada
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

        // 4. VERIFICAR QUE EL DOCUMENTO EXISTE EN STORAGE
        console.log('. Verificando documento en storage:', contratoFinal.ruta_documento);
        const { data: fileData, error: fileError } = await supabase.storage
            .from('kyc-documents')
            .download(contratoFinal.ruta_documento);

        if (fileError) {
            console.error('. . Documento no encontrado en storage:', fileError);
            
            // Intentar regenerar el documento
            try {
                console.log('. 🔄 Regenerando documento...');
                await ContratoController.generarWordContrato(contratoFinal.id, solicitud);
                
                // Reintentar descarga
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

        // 5. VERIFICAR SI YA EXISTE PROCESO DE FIRMA
        const { data: firmaExistente } = await supabase
            .from('firmas_digitales')
            .select('id, estado, fecha_expiracion')
            .eq('solicitud_id', solicitud_id)
            .in('estado', ['pendiente', 'enviado', 'firmado_solicitante', 'firmado_operador'])
            .single();

        if (firmaExistente && !forzar_reinicio) {
            console.log('. Ya existe proceso de firma:', firmaExistente);
            
            // Si está expirado, permitir continuar
            if (firmaExistente.fecha_expiracion && new Date(firmaExistente.fecha_expiracion) < new Date()) {
                console.log('. Proceso de firma expirado, continuando...');
                await supabase
                    .from('firmas_digitales')
                    .update({ 
                        estado: 'expirado',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', firmaExistente.id);
            } else {
                const puedeReiniciar = await FirmaDigitalController.verificarPuedeReiniciarFirma(firmaExistente);
                if (!puedeReiniciar) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un proceso de firma en curso para esta solicitud',
                        data: {
                            firma_existente: firmaExistente,
                            puede_reintentar: false
                        }
                    });
                }
            }
        }

        // 6. PROCESAR EL DOCUMENTO PARA FIRMA
        const buffer = Buffer.from(await fileData.arrayBuffer());
        
        // Generar hash del documento original con metadatos
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

        // 7. CREAR SOLICITUD DE FIRMA MÚLTIPLE
        const solicitante = solicitud.solicitantes?.usuarios;
        const operador = solicitud.operadores?.usuarios || usuario;

        const firmaResult = await FirmaDigitalController.crearSolicitudFirmaMultiple(
            contratoFinal.id,
            solicitante,
            operador
        );

        if (!firmaResult.success) {
            // Fallback a firma individual
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

        // 8. REGISTRAR EN BASE DE DATOS
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

        // 9. ACTUALIZAR CONTRATO
        await supabase
            .from('contratos')
            .update({
                estado: 'pendiente_firma',
                firma_digital_id: firma.id,
                hash_contrato: hashOriginal,
                updated_at: new Date().toISOString()
            })
            .eq('id', contratoFinal.id);

        // 10. REGISTRAR AUDITORÍA
        await supabase
            .from('auditoria_firmas')
            .insert({
                firma_id: firma.id,
                usuario_id: usuario.id,
                accion: 'iniciar_proceso_firma',
                descripcion: 'Proceso de firma digital iniciado con verificaciones .s',
                estado_anterior: 'pendiente',
                estado_nuevo: 'enviado',
                signature_request_id: firmaResult.signatureRequestId,
                ip_address: req.ip,
                user_agent: req.get('User-Agent'),
                created_at: new Date().toISOString()
            });

        // 11. CREAR NOTIFICACIONES
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
                fecha_expiracion: firmaData.fecha_expiracion
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

        // CONSULTA . - Usar objetos en lugar de arrays
        const { data: firma, error: firmaError } = await supabase
            .from('firmas_digitales')
            .select(`
                id,
                estado,
                fecha_expiracion,
                hash_documento_original,
                contrato_id,
                solicitud_id,
                contratos (
                    id,
                    ruta_documento,
                    solicitud_id,
                    numero_contrato,
                    estado
                ),
                solicitudes_credito (
                    numero_solicitud,
                    solicitante_id,
                    operador_id
                )
            `)
            .eq('id', firma_id)
            .single();

        if (firmaError) {
            console.error('. Error en consulta de firma:', firmaError);
            if (firmaError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Proceso de firma no encontrado'
                });
            }
            throw firmaError;
        }

        if (!firma) {
            return res.status(404).json({
                success: false,
                message: 'Proceso de firma no encontrado'
            });
        }

        // CORRECCIÓN: Acceder directamente a los objetos de relación
        const contrato = firma.contratos;
        const solicitud = firma.solicitudes_credito;

        // VERIFICACIÓN CRÍTICA .
        if (!contrato) {
            console.error('. Contrato no encontrado para firma:', firma_id);
            
            // Intentar recuperar el contrato por solicitud_id como fallback
            const { data: contratoFallback, error: contratoFallbackError } = await supabase
                .from('contratos')
                .select('*')
                .eq('solicitud_id', firma.solicitud_id)
                .single();

            if (contratoFallbackError || !contratoFallback) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado para este proceso de firma'
                });
            }

            // Actualizar la firma con el contrato_id correcto
            await supabase
                .from('firmas_digitales')
                .update({ contrato_id: contratoFallback.id })
                .eq('id', firma_id);

            console.log('. Contrato recuperado y relación actualizada:', contratoFallback.id);
        }

        const contratoFinal = contrato || contratoFallback;

        if (!contratoFinal.ruta_documento) {
            console.error('. Contrato sin documento:', contratoFinal.id);
            return res.status(404).json({
                success: false,
                message: 'El contrato no tiene documento Word generado'
            });
        }

        console.log('. Contrato encontrado:', contratoFinal.ruta_documento);

        // Obtener información del solicitante con más detalles
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

        // Preparar datos del contrato para el frontend - CORRECCIÓN: DECLARAR LA VARIABLE
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

        // Obtener el documento Word original
        console.log('. Descargando documento desde:', contratoFinal.ruta_documento);
        const { data: fileData, error: fileError } = await supabase.storage
            .from('kyc-documents')
            .download(contratoFinal.ruta_documento);

        if (fileError) {
            console.error('. Error accediendo al documento:', fileError);
            return res.status(404).json({
                success: false,
                message: 'No se pudo acceder al documento del contrato'
            });
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        const documentoBase64 = buffer.toString('base64');

        // Preparar respuesta
        const responseData = {
            firma: {
                id: firma.id,
                estado: firma.estado,
                fecha_expiracion: firma.fecha_expiracion,
                solicitudes_credito: solicitud || {}
            },
            documento: documentoBase64,
            nombre_documento: `contrato-${solicitud?.numero_solicitud || 'sin-numero'}.docx`,
            tipo_documento: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fecha_expiracion: firma.fecha_expiracion,
            solicitante: solicitudCompleta?.solicitantes?.usuarios,
            hash_original: firma.hash_documento_original,
            datos_contrato: datosContrato // Incluir los datos del contrato
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
     * Obtener documento para firma (base64)
     */
    static async obtenerDocumentoParaFirma(req, res) {
        try {
            const { firma_id } = req.params;

            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select('contratos(ruta_documento)')
                .eq('id', firma_id)
                .single();

            if (error || !firma) {
                return res.status(404).json({
                    success: false,
                    message: 'Proceso de firma no encontrado'
                });
            }

            const { data: fileData, error: fileError } = await supabase.storage
                .from('kyc-documents')
                .download(firma.contratos.ruta_documento);

            if (fileError) {
                throw new Error('No se pudo acceder al documento: ' + fileError.message);
            }

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
     * Procesar firma del documento - VERSIÓN . CON FIRMA ACUMULATIVA
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
            console.log('. Datos recibidos:', {
                tipo_firma: tipo_firma,
                tiene_firma_data: !!firma_data
            });

            // Validaciones
            if (!firma_data || !tipo_firma) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de firma y tipo son requeridos'
                });
            }

            // Obtener información actual de la firma
            const { data: firma, error: firmaError } = await supabase
                .from('firmas_digitales')
                .select(`
                    *,
                    contratos (
                        ruta_documento,
                        id
                    )
                `)
                .eq('id', firma_id)
                .single();

            if (firmaError || !firma) {
                console.error('. Error obteniendo firma:', firmaError);
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
                hashDocumento: firma.hash_documento_original,
                ipFirmante: ip_address,
                userAgent: user_agent
            };

            // . USAR EL NUEVO MÉTODO DE FIRMA ACUMULATIVA
            const firmaResult = await WordService.procesarFirmaAcumulativa(
                firma_id, 
                datosFirma, 
                tipo_firma
            );

            if (!firmaResult.success) {
                throw new Error('Error procesando firma: ' + firmaResult.error);
            }

const integridadValida = await WordService.verificarIntegridadCompleta(firma_id);

// Asegurar que sea boolean
const esIntegridadValida = Boolean(integridadValida);

// Actualizar base de datos
const updateData = {
    hash_documento_firmado: firmaResult.hash,
    integridad_valida: esIntegridadValida, // . Ahora siempre será boolean
    
    estado: esIntegridadValida ? 'firmado_completo' : `firmado_${tipo_firma}`,
    fecha_firma_completa: esIntegridadValida ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    url_documento_firmado: firmaResult.ruta
};

            // Configurar según tipo de firma
            if (tipo_firma === 'solicitante') {
                updateData.fecha_firma_solicitante = new Date().toISOString();
                updateData.ip_firmante = ip_address;
                updateData.user_agent_firmante = user_agent;
                updateData.ubicacion_firmante = datosFirma.ubicacion;
            } else if (tipo_firma === 'operador') {
                updateData.fecha_firma_operador = new Date().toISOString();
            }

            const { error: updateError } = await supabase
                .from('firmas_digitales')
                .update(updateData)
                .eq('id', firma_id);

            if (updateError) {
                throw updateError;
            }

            // Actualizar contrato
            await supabase
                .from('contratos')
                .update({
                    estado: updateData.estado,
                    updated_at: new Date().toISOString(),
                    ...(tipo_firma === 'solicitante' && { 
                        fecha_firma_solicitante: new Date().toISOString() 
                    }),
                    ...(tipo_firma === 'operador' && { 
                        fecha_firma_operador: new Date().toISOString() 
                    }),
                    ...(integridadValida && { 
                        fecha_firma_completa: new Date().toISOString(),
                        estado: 'vigente'
                    })
                })
                .eq('id', firma.contrato_id);

            // Registrar auditoría
            await supabase
                .from('auditoria_firmas')
                .insert({
                    firma_id: firma_id,
                    usuario_id: usuario_id,
                    accion: 'firma_documento_acumulativa',
                    descripcion: `Documento firmado por ${tipo_firma} usando firma acumulativa. Integridad: ${integridadValida ? 'COMPLETA' : 'PARCIAL'}`,
                    estado_anterior: firma.estado,
                    estado_nuevo: updateData.estado,
                    ip_address: ip_address,
                    user_agent: user_agent,
                    created_at: new Date().toISOString()
                });

            // Procesar según el tipo de firma
            if (tipo_firma === 'solicitante') {
                await FirmaDigitalController.procesarFirmaSolicitante(firma_id, firma);
            } else if (tipo_firma === 'operador') {
                await FirmaDigitalController.procesarFirmaOperador(firma_id, firma);
            }

            // Si la integridad es completa, notificar a todas las partes
            if (integridadValida) {
                await FirmaDigitalController.marcarFirmaCompleta(firma_id, firma);
            }

            console.log('. . Firma acumulativa procesada exitosamente:', { 
                firma_id, 
                tipo_firma, 
                integridad_completa: integridadValida,
                nuevo_estado: updateData.estado
            });

            res.json({
                success: true,
                message: integridadValida ? 
                    '. CONTRATO COMPLETAMENTE FIRMADO - Integridad válida' : 
                    '📝 Firma procesada exitosamente - Esperando contrafirma',
                data: {
                    firma_id: firma_id,
                    estado: updateData.estado,
                    integridad_valida: integridadValida,
                    url_descarga: firmaResult.ruta,
                    hash_firmado: firmaResult.hash,
                    es_firma_completa: integridadValida
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
      console.log( '👨‍💼 Procesando firma del operador:', firmaId);

      // Verificar si ambas partes han firmado
      const { data: firmaActual } = await supabase
        .from('firmas_digitales')
        .select('*')
        .eq('id', firmaId)
        .single();

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
      console.log( '. Marcando firma como completa:', firmaId);

      await supabase
        .from('firmas_digitales')
        .update({
          estado: 'firmado_completo',
          fecha_firma_completa: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', firmaId);

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

      console.log ('📄 Contrato completamente firmado:', firma.contrato_id);

    } catch (error) {
      console.error('. Error marcando firma como completa:', error);
    }
  }

  /**
   * Verificar permisos para firmar
   */
 static async verificarPermisosFirma(usuario_id, firma) {
    try {
        // Obtener información del usuario
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('rol, email')
            .eq('id', usuario_id)
            .single();

        if (!usuario) {
            console.error('. Usuario no encontrado:', usuario_id);
            return false;
        }

        console.log('. Verificando permisos para:', usuario.email, 'rol:', usuario.rol);

        // Administradores y operadores pueden firmar cualquier documento
        if (['admin', 'operador'].includes(usuario.rol)) {
            console.log('. Permiso concedido por rol:', usuario.rol);
            return true;
        }

        // Solicitantes solo pueden firmar sus propios documentos
        if (usuario.rol === 'solicitante') {
            const solicitud = firma.solicitudes_credito?.[0];
            if (!solicitud) {
                console.error('. No se pudo obtener información de la solicitud');
                return false;
            }

            const esSolicitante = solicitud.solicitante_id === usuario_id;
            console.log('. Verificación solicitante:', {
                solicitante_id: solicitud.solicitante_id,
                usuario_id,
                coincide: esSolicitante
            });
            
            return esSolicitante;
        }

        console.warn('. Rol no reconocido:', usuario.rol);
        return false;
    } catch (error) {
        console.error('. Error verificando permisos de firma:', error);
        return false;
    }
}
 /**
 * Descargar documento firmado - . .
 */
static async descargarDocumentoFirmado(req, res) {
    try {
        const { firma_id } = req.params;
        const usuario = req.usuario;

        console.log('. Descargando documento firmado para firma:', firma_id);

        // Obtener información de la firma con menos restricciones
        const { data: firma, error } = await supabase
            .from('firmas_digitales')
            .select(`
                id,
                estado,
                url_documento_firmado,
                solicitud_id,
                contrato_id,
                contratos (
                    id,
                    estado,
                    ruta_documento
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

        // VERIFICACIÓN .: Permitir descarga en más estados
const estadosPermitidos = [
  'borrador', 'enviado', 'en_revision', 'pendiente_info', 
  'pendiente_firmas', 'aprobado', 'rechazado'
];        
        if (!estadosPermitidos.includes(firma.estado)) {
            console.log('. Estado no permitido para descarga:', firma.estado);
            return res.status(400).json({
                success: false,
                message: `El documento no está disponible para descarga. Estado actual: ${firma.estado}`,
                estado_actual: firma.estado,
                estados_permitidos: estadosPermitidos
            });
        }

        // Determinar qué ruta usar para la descarga
        let rutaDescarga = firma.url_documento_firmado;

        // Si no hay documento firmado, usar el documento original del contrato
        if (!rutaDescarga && firma.contratos && firma.contratos.ruta_documento) {
            console.log('. Usando documento original del contrato');
            rutaDescarga = firma.contratos.ruta_documento;
        }

        if (!rutaDescarga) {
            return res.status(404).json({
                success: false,
                message: 'Documento no encontrado en el sistema'
            });
        }

        console.log('. Descargando documento desde:', rutaDescarga);

        // Descargar archivo
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('kyc-documents')
            .download(rutaDescarga);

        if (downloadError) {
            console.error('. Error descargando archivo:', downloadError);
            return res.status(404).json({
                success: false,
                message: 'Error al acceder al archivo: ' + downloadError.message
            });
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determinar nombre del archivo
        const nombreArchivo = rutaDescarga.includes('contrato-firmado') 
            ? `contrato-firmado-${firma_id}.docx`
            : `contrato-original-${firma_id}.docx`;

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache');

        console.log('. Documento descargado exitosamente:', nombreArchivo);

        res.send(buffer);

    } catch (error) {
        console.error('. Error descargando documento firmado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al descargar documento: ' + error.message
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
                .in('estado', ['enviado', 'firmado_solicitante', 
'firmado_operador']) 
                .order('fecha_envio', { ascending: true }); 
 
            // Filtrar por rol 
            if (rol === 'solicitante') { 
122 
 
                query = query.eq('solicitudes_credito.solicitante_id', 
usuario_id); 
            } else if (rol === 'operador') { 
                query = query.eq('solicitudes_credito.operador_id', 
usuario_id); 
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
117 
 
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
static async obtenerNumeroPaginasWord(buffer) {
  try {
    // ⚙️ Aproximación: una página cada 1800 palabras (ajústalo según tu caso)
    const texto = buffer.toString('utf8');
    const palabras = texto.split(/\s+/).length;
    const paginasEstimadas = Math.max(1, Math.ceil(palabras / 1800));
    return paginasEstimadas;
  } catch (error) {
    console.error('Error obteniendo número de páginas Word:', error);
    return 1; // valor por defecto
  }
}
 /**
     * Crear solicitud de firma múltiple - . .
     */
static async crearSolicitudFirmaMultiple(contratoId, solicitante, operador) {
    try {
        console.log('. Creando solicitud de firma múltiple INTERNA para documento ID:', contratoId);

        // Generar IDs únicos para la firma interna
        const signatureRequestId = crypto.randomUUID();

        // Crear URLs de firma interna
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

        // Generar IDs únicos para la firma interna
        const signatureRequestId = crypto.randomUUID();

        // Crear URL de firma interna
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
 * Verificar si se puede reiniciar el proceso de firma
 */
static async verificarPuedeReiniciarFirma(firmaExistente) {
    try {
        // Permitir reinicio si han pasado más de 30 minutos desde el último intento
        const { data: firmaCompleta } = await supabase
            .from('firmas_digitales')
            .select('created_at, intentos_envio, estado')
            .eq('id', firmaExistente.id)
            .single();

        if (!firmaCompleta) return true;

        const tiempoTranscurrido = Date.now() - new Date(firmaCompleta.created_at).getTime();
        const minutosTranscurridos = tiempoTranscurrido / (1000 * 60);

        // Permitir reinicio después de 30 minutos o si hay menos de 3 intentos
        if (minutosTranscurridos > 30 || (firmaCompleta.intentos_envio || 0) < 3) {
            return true;
        }

        return false;
    } catch (error) {
        console.error('. Error verificando reinicio de firma:', error);
        return true; // Por defecto permitir reinicio en caso de error
    }
}

// En FirmaDigitalController.js

/**
 * Verificar si existe proceso de firma para una solicitud
 */
static async verificarFirmaExistente(req, res) {
    try {
        const { solicitud_id } = req.params;

        const { data: firmaExistente } = await supabase
            .from('firmas_digitales')
            .select('*')
            .eq('solicitud_id', solicitud_id)
            .in('estado', ['pendiente', 'enviado', 'firmado_solicitante', 'firmado_operador'])
            .single();

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
 * Renovar firma expirada
 */
static async renovarFirmaExpirada(req, res) {
    try {
        const { solicitud_id } = req.params;

        console.log('. Renovando firma expirada para:', solicitud_id);

        // Buscar firma expirada
        const { data: firmaExpirada } = await supabase
            .from('firmas_digitales')
            .select('*')
            .eq('solicitud_id', solicitud_id)
            .eq('estado', 'expirado')
            .single();

        if (!firmaExpirada) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró firma expirada para renovar'
            });
        }

        // Actualizar fechas y estado
        const nuevaFirmaData = {
            estado: 'enviado',
            fecha_envio: new Date().toISOString(),
            fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            intentos_envio: (firmaExpirada.intentos_envio || 0) + 1,
            updated_at: new Date().toISOString()
        };

        const { data: firmaRenovada, error } = await supabase
            .from('firmas_digitales')
            .update(nuevaFirmaData)
            .eq('id', firmaExpirada.id)
            .select()
            .single();

        if (error) throw error;

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
// En FirmaDigitalController.js - Agregar este método
static async repararRelacionFirmaContrato(req, res) {
    try {
        const { firma_id } = req.params;

        console.log('. Reparando relación firma-contrato para:', firma_id);

        // Obtener firma
        const { data: firma, error: firmaError } = await supabase
            .from('firmas_digitales')
            .select('*')
            .eq('id', firma_id)
            .single();

        if (firmaError || !firma) {
            return res.status(404).json({
                success: false,
                message: 'Firma no encontrada'
            });
        }

        // Buscar contrato por solicitud_id
        const { data: contrato, error: contratoError } = await supabase
            .from('contratos')
            .select('*')
            .eq('solicitud_id', firma.solicitud_id)
            .single();

        if (contratoError || !contrato) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró contrato para esta solicitud'
            });
        }

        // Actualizar la firma con el contrato_id correcto
        const { error: updateError } = await supabase
            .from('firmas_digitales')
            .update({ 
                contrato_id: contrato.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', firma_id);

        if (updateError) {
            throw updateError;
        }

        console.log('. Relación reparada:', { firma_id, contrato_id: contrato.id });

        res.json({
            success: true,
            message: 'Relación firma-contrato reparada exitosamente',
            data: {
                firma_id: firma_id,
                contrato_id: contrato.id,
                contrato_ruta_documento: contrato.ruta_documento
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
}

module.exports = FirmaDigitalController;