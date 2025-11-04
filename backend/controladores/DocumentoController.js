const DocumentoModel = require('../modelos/DocumentoModel');
const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const diditService = require('../servicios/diditService');
const OperadorController= require('../controladores/OperadorController');
// Importar pdfjs-dist legacy para Node.js
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const Tesseract = require('tesseract.js');
const { createCanvas } = require('canvas');

class DocumentoController {
  // Subir documento - .
    static async subirDocumento(req, res) {
        try {
            const { tipo } = req.body;
            const { solicitud_id } = req.params;
            const archivo = req.file;

            console.log('. Datos recibidos:', { solicitud_id, tipo, archivo: archivo ? archivo.originalname : 'NO ARCHIVO' });

            // Validaciones básicas
            if (!solicitud_id || !tipo || !archivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Solicitud ID, tipo y archivo son requeridos'
                });
            }

            console.log(`. Subiendo documento ${tipo} para solicitud: ${solicitud_id}`);

            // Validar tipo de documento usando el modelo
            DocumentoModel.validarTipoDocumento(tipo);

            // Generar ruta de storage usando el modelo
            const rutaStorage = DocumentoModel.generarRutaStorage(solicitud_id, tipo, archivo.originalname);
            
            // Subir archivo al storage usando el modelo
            await DocumentoModel.subirArchivoStorage(rutaStorage, archivo.buffer, archivo.mimetype);

            // Obtener URL pública usando el modelo
            const urlPublica = await DocumentoModel.obtenerUrlPublica(rutaStorage);

            // Extraer información del documento
            let informacionExtraida = null;
            if (archivo.originalname.toLowerCase().endsWith('.pdf')) {
                informacionExtraida = await DocumentoController.extraerInformacionDocumento(urlPublica, tipo, archivo.buffer);
            }

            // Guardar en base de datos usando el modelo
            const documentoData = {
                solicitud_id,
                tipo,
                nombre_archivo: archivo.originalname,
                ruta_storage: rutaStorage,
                tamanio_bytes: archivo.size,
                estado: 'pendiente',
                informacion_extraida: informacionExtraida,
                created_at: new Date().toISOString()
            };

            const documento = await DocumentoModel.crear(documentoData);

            console.log(`. Documento ${tipo} guardado en BD con ID:`, documento.id);

            // Iniciar verificación automática si es DNI
            if (tipo === 'dni') {
                await DocumentoController.iniciarVerificacionDidit(solicitud_id, documento.id, archivo.buffer);
            }

            res.status(201).json({
                success: true,
                message: 'Documento subido exitosamente',
                data: {
                    documento,
                    url_publica: urlPublica,
                    informacion_extraida: informacionExtraida 
                }
            });

        } catch (error) {
            console.error('. Error en subirDocumento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno al subir documento'
            });
        }
    }
  // Métodos auxiliares privados - .S (static)
  static async subirArchivoStorage(archivo, solicitudId, tipo) {
    const extension = archivo.originalname.toLowerCase().split('.').pop();
    const nombreArchivo = `${solicitudId}_${tipo}_${Date.now()}.${extension}`;
    const rutaStorage = `documentos/${solicitudId}/${nombreArchivo}`;
    
    console.log('. Subiendo a storage:', rutaStorage);

    // USAR supabaseAdmin para bypassear RLS temporalmente
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('kyc-documents')
      .upload(rutaStorage, archivo.buffer, {
        contentType: archivo.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('. Error subiendo archivo:', uploadError);
      throw new Error(`Error subiendo archivo: ${uploadError.message}`);
    }

    console.log('. Archivo subido exitosamente');
    return nombreArchivo;
  }
   static async extraerInformacionDocumento(pdfUrl, tipo, buffer) {
        try {
            let texto = '';
            if (tipo === 'dni') {
                texto = await DocumentoController.procesarDNIconOCR(pdfUrl);
            } else {
                texto = await DocumentoController.extraerTextoDePDF(pdfUrl);
            }
            
            const informacionExtraida = DocumentoController.extraerInformacionEspecifica(tipo, texto);
            return informacionExtraida || null;
            
        } catch (error) {
            console.warn('. No se pudo extraer información del documento:', error.message);
            return null;
        }
    }


  static async extraerTextoDePDF(pdfUrl) {
    try {
      console.log('. Extrayendo texto de PDF desde URL:', pdfUrl);
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText.trim().length > 0 ? fullText : '';
    } catch (error) {
      console.error('. Error extrayendo texto PDF:', error);
      return '';
    }
  }

  static async procesarDNIconOCR(pdfUrl) {
    try {
      console.log('. Procesando DNI con OCR...');
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      console.log('. Aplicando OCR...');
      const { data: { text } } = await Tesseract.recognize(
        canvas.toBuffer(),
        'spa',
        { logger: m => console.log('Progreso OCR:', m.status) }
      );
      
      return text && text.trim().length > 0 ? text : null;
    } catch (error) {
      console.error(". Error en OCR:", error);
      return null;
    }
  }

  static extraerInformacionEspecifica(tipo, texto) {
    const informacion = {};
    
    if (!texto || texto.includes('no se pudo extraer') || texto.includes('Error') || texto.includes('sin texto')) {
      console.log('. Texto no válido para extracción');
      return null;
    }

    console.log(`. Extrayendo información para tipo: ${tipo}`);
    console.log(`. Texto disponible (primeros 300 chars): ${texto.substring(0, 300)}...`);

    try {
      switch (tipo) {
        case 'dni':
          // Patrones para DNI argentino
          const dniMatch = texto.match(/(\d{1,2}\.?\d{3}\.?\d{3})|(\d{7,8})/g);
          if (dniMatch) {
            informacion.numero_documento = dniMatch[0].replace(/\./g, '');
          }
          
          // Buscar nombres y apellidos
          const lineas = texto.split('\n').filter(linea => linea.trim().length > 2);
          
          for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i].toLowerCase();
            
            if ((linea.includes('apellido') || linea.includes('apellidos')) && i + 1 < lineas.length) {
              informacion.apellido = lineas[i + 1].trim();
            }
            
            if ((linea.includes('nombre') || linea.includes('nombres')) && i + 1 < lineas.length) {
              informacion.nombres = lineas[i + 1].trim();
            }
          }
          break;

        case 'cuit':
          // Buscar CUIT
          const cuitMatch = texto.match(/(\d{2}[\-\s]?\d{8}[\-\s]?\d{1})/);
          if (cuitMatch) {
            informacion.cuit = cuitMatch[0].replace(/\s/g, '-');
          }
          break;

        case 'comprobante_domicilio':
          const clienteMatch = texto.match(/(Cliente|Titular|Usuario)[:\s]*([^\n\r]+)/i);
          if (clienteMatch && clienteMatch[2]) {
            informacion.cliente = clienteMatch[2].trim();
          }
          break;

        case 'balance_contable':
          const activoMatch = texto.match(/(TOTAL ACTIVO|ACTIVO TOTAL)[:\s]*\$?\s*([\d.,]+)/i);
          if (activoMatch && activoMatch[2]) {
            informacion.total_activo = parseFloat(activoMatch[2].replace(/[^\d.]/g, ''));
          }
          break;

        case 'declaracion_impuestos':
          const periodoMatch = texto.match(/(Per[ií]odo|Ejercicio)[:\s]*([^\n\r]+)/i);
          if (periodoMatch && periodoMatch[2]) {
            informacion.periodo = periodoMatch[2].trim();
          }
          break;
      }

      console.log(`. Información extraída para ${tipo}:`, informacion);
      return Object.keys(informacion).length > 0 ? informacion : null;
      
    } catch (error) {
      console.error('. Error en extracción de información:', error);
      return null;
    }
  }
 // Modificar el método de verificación Didit para usar simulación en desarrollo
  static async iniciarVerificacionDidit(solicitudId, documentoId, archivoBuffer) {
    try {
      console.log(`. Iniciando verificación Didit para documento: ${documentoId}`);
      
      const resultado = await diditService.verifyIdentity(archivoBuffer);
      
      if (resultado.success) {
        const estadoDocumento = (resultado.data.id_verification?.status === 'Approved') ? 'validado' : 'rechazado';
        
        // Construir información extraída simulada para desarrollo
        let informacionExtraida = null;
        if (process.env.NODE_ENV === 'development' && resultado.data.id_verification) {
          informacionExtraida = {
            dni: resultado.data.id_verification.document_number || '0977777777',
            sexo: resultado.data.id_verification.gender || 'M',
            nombres: resultado.data.id_verification.full_name?.split(' ').slice(0, 2).join(' ') || 'JOSHUA JAVIER',
            apellido: resultado.data.id_verification.full_name?.split(' ').slice(2).join(' ') || 'CASTILLO',
            ejemplar: 'A',
            domicilio: 'Dirección de Javier AV. CORRIENTES 1234, PISO 5, DEPTO B',
            localidad: 'CIUDAD AUTÓNOMA DE BUENOS AIRES',
            codigo_postal: 'C1043AAB',
            fecha_emision: '2020-01-20',
            fecha_nacimiento: resultado.data.id_verification.date_of_birth || '2004-07-01',
            lugar_nacimiento: 'BUENOS AIRES, CAPITAL FEDERAL',
            fecha_vencimiento: '2030-01-20'
          };
        }

        await supabase
          .from('documentos')
          .update({
            estado: estadoDocumento,
            comentarios: `Verificación Didit: ${resultado.data.id_verification?.status}`,
            validado_en: new Date().toISOString(),
            ...(informacionExtraida && { informacion_extraida: informacionExtraida })
          })
          .eq('id', documentoId);

        // Guardar en verificaciones_kyc con datos simulados para desarrollo
        await DocumentoController.guardarVerificacionKYC(solicitudId, resultado);
        
        console.log(`. Verificación Didit completada: ${estadoDocumento}`);
      }
    } catch (error) {
      console.error('. Error en verificación Didit:', error);
    }
  }
  // Modificar guardarVerificacionKYC para desarrollo
  static async guardarVerificacionKYC(solicitudId, resultado) {
    try {
      let datosVerificacion = resultado.data;
      
      // En desarrollo, enriquecer datos con estructura esperada
      if (process.env.NODE_ENV === 'development') {
        datosVerificacion = {
          created_at: new Date().toISOString(),
          request_id: `simulado_${Date.now()}`,
          session_id: resultado.data.session_id,
          id_verification: {
            age: 21,
            mrz: {
              sex: 'M',
              name: 'JOSHUA JAV',
              errors: [],
              country: 'ECU',
              mrz_key: '081126020004070123402270',
              surname: 'CASTILLO MEREJILDO',
              mrz_type: 'TD1',
              warnings: ['possible truncating'],
              birth_date: '040701',
              final_hash: '2',
              mrz_string: 'I<ECU0811260200<<<<<0943802926\n0407012M3402270ECU<NO<DONANTE2\nCASTILLO<MEREJILDO<<JOSHUA<JAV',
              expiry_date: '340227',
              nationality: 'ECU',
              document_type: 'ID',
              optional_data: '0943802926',
              birth_date_hash: '2',
              document_number: '081126020',
              optional_data_2: 'NO<DONANTE',
              personal_number: '0943802926',
              expiry_date_hash: '0',
              document_number_hash: '0'
            },
            gender: 'M',
            status: 'Approved',
            address: null,
            barcodes: [],
            warnings: [],
            full_name: 'Joshua Javier Castillo Merejildo',
            last_name: 'Castillo Merejildo',
            back_image: null,
            first_name: 'Joshua Javier',
            front_image: 'https://example.com/simulated-front-image.jpg',
            nationality: 'ECU',
            extra_fields: {
              blood_group: 'O+',
              first_surname: 'Castillo',
              second_surname: 'Merejildo'
            },
            date_of_birth: '2004-07-01',
            date_of_issue: '2024-02-27',
            document_type: 'Identity Card',
            issuing_state: 'ECU',
            marital_status: 'SINGLE',
            parsed_address: null,
            place_of_birth: 'Guayas Guayaquil, Bolivar (Sagrario)',
            portrait_image: 'https://example.com/simulated-portrait-image.jpg',
            document_number: '081126020',
            expiration_date: '2034-02-27',
            personal_number: '0943802926',
            formatted_address: null,
            issuing_state_name: 'Ecuador'
          },
          document_analysis: {
            type: 'DNI',
            country: 'AR'
          }
        };
      }

      const verificacionData = {
        solicitud_id: solicitudId,
        session_id: resultado.data.session_id || `didit_${Date.now()}`,
        proveedor: 'didit',
        estado: (resultado.data.id_verification?.status || 'approved').toLowerCase(),
        datos_verificacion: datosVerificacion,
        created_at: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('verificaciones_kyc')
        .insert([verificacionData]);
        
      if (error) throw error;
      
      console.log('. Verificación KYC guardada en base de datos');
    } catch (error) {
      console.error('. Error guardando verificación KYC:', error);
    }
  }


  // Obtener documentos de una solicitud
   static async obtenerDocumentosSolicitud(req, res) {
        try {
            const { solicitud_id } = req.params;
            
            const documentos = await DocumentoModel.obtenerPorSolicitud(solicitud_id);

            res.json({
                success: true,
                data: documentos
            });
        } catch (error) {
            console.error('. Error obteniendo documentos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener documentos'
            });
        }
    }

  // Validar documento (para operadores)
     static async validarDocumento(req, res) {
        try {
            const { documento_id } = req.params;
            const { estado, comentarios } = req.body;
            
            if (!['validado', 'rechazado'].includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado debe ser "validado" o "rechazado"'
                });
            }

            // Verificar permisos usando el modelo
            const tienePermisos = await DocumentoModel.verificarPermisos(
                documento_id, 
                req.usuario.id, 
                req.usuario.rol
            );

            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para validar este documento'
                });
            }

            const documento = await DocumentoModel.actualizar(documento_id, {
                estado,
                comentarios,
                validado_en: new Date().toISOString()
            });

            console.log(`. Documento ${documento_id} ${estado} por operador`);

            res.json({
                success: true,
                message: `Documento ${estado} exitosamente`,
                data: documento
            });
        } catch (error) {
            console.error('. Error validando documento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al validar documento'
            });
        }
    }
  static async descargarDocumento(req, res) {
        try {
            const { documento_id } = req.params;
            
            console.log(`. Descargando documento: ${documento_id}`);

            // Verificar permisos usando el modelo
            const tienePermisos = await DocumentoModel.verificarPermisos(
                documento_id, 
                req.usuario.id, 
                req.usuario.rol
            );

            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a este documento'
                });
            }

            // Obtener información del documento usando el modelo
            const documento = await DocumentoModel.obtenerPorId(documento_id);

            if (!documento) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado'
                });
            }

            // Descargar archivo usando el modelo
            const fileData = await DocumentoModel.descargarArchivo(documento.ruta_storage);
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_archivo}"`);
            res.setHeader('Content-Length', buffer.length);

            console.log(`. Documento descargado: ${documento.nombre_archivo}`);
            res.send(buffer);

        } catch (error) {
            console.error('. Error en descargarDocumento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al descargar el documento'
            });
        }
    }
    /**
     * Actualizar documento existente
     */
    static async actualizarDocumento(req, res) {
        try {
            const { documento_id } = req.params;
            const { tipo } = req.body;
            const archivo = req.file;

            console.log('. Actualizando documento:', { documento_id, tipo, archivo: archivo ? archivo.originalname : 'NO ARCHIVO' });

            if (!documento_id || !tipo || !archivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Documento ID, tipo y archivo son requeridos'
                });
            }

            // Obtener documento actual usando el modelo
            const documentoActual = await DocumentoModel.obtenerPorId(documento_id);

            if (!documentoActual) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado'
                });
            }

            console.log(`. Actualizando documento ${tipo} con ID: ${documento_id}`);

            // Eliminar archivo anterior del storage usando el modelo
            try {
                await DocumentoModel.eliminarArchivoStorage(documentoActual.ruta_storage);
                console.log('. Archivo anterior eliminado:', documentoActual.ruta_storage);
            } catch (storageError) {
                console.warn('. Error eliminando archivo anterior:', storageError.message);
            }

            // Generar nueva ruta de storage usando el modelo
            const rutaStorage = DocumentoModel.generarRutaStorage(documentoActual.solicitud_id, tipo, archivo.originalname);
            
            // Subir nuevo archivo usando el modelo
            await DocumentoModel.subirArchivoStorage(rutaStorage, archivo.buffer, archivo.mimetype);

            // Obtener URL pública usando el modelo
            const urlPublica = await DocumentoModel.obtenerUrlPublica(rutaStorage);

            // Extraer información del nuevo documento
            let informacionExtraida = null;
            if (archivo.originalname.toLowerCase().endsWith('.pdf')) {
                informacionExtraida = await DocumentoController.extraerInformacionDocumento(urlPublica, tipo, archivo.buffer);
            }

            // Actualizar documento en base de datos usando el modelo
            const documentoData = {
                tipo,
                nombre_archivo: archivo.originalname,
                ruta_storage: rutaStorage,
                tamanio_bytes: archivo.size,
                estado: 'pendiente',
                informacion_extraida: informacionExtraida,
                validado_en: null,
                comentarios: null
            };

            const documento = await DocumentoModel.actualizar(documento_id, documentoData);

            console.log(`. Documento ${tipo} actualizado en BD con ID:`, documento.id);

            // Si es DNI, iniciar nueva verificación
            if (tipo === 'dni') {
                await DocumentoController.iniciarVerificacionDidit(documentoActual.solicitud_id, documento.id, archivo.buffer);
            }

            res.json({
                success: true,
                message: 'Documento actualizado exitosamente',
                data: {
                    documento,
                    url_publica: urlPublica,
                    informacion_extraida: informacionExtraida
                }
            });

        } catch (error) {
            console.error('. Error en actualizarDocumento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno al actualizar documento'
            });
        }
    }
    /**
     * Eliminar documento
     */
    static async eliminarDocumento(req, res) {
        try {
            const { documento_id } = req.params;

            console.log('🗑️ Eliminando documento:', documento_id);

            if (!documento_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Documento ID es requerido'
                });
            }

            // Obtener documento usando el modelo
            const documento = await DocumentoModel.obtenerPorId(documento_id);

            if (!documento) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado'
                });
            }

            // Eliminar archivo del storage usando el modelo
            try {
                await DocumentoModel.eliminarArchivoStorage(documento.ruta_storage);
                console.log('. Archivo eliminado:', documento.ruta_storage);
            } catch (storageError) {
                console.warn('. Error eliminando archivo:', storageError.message);
            }

            // Eliminar registro de la base de datos usando el modelo
            await DocumentoModel.eliminar(documento_id);

            console.log(`. Documento eliminado: ${documento_id}`);

            res.json({
                success: true,
                message: 'Documento eliminado exitosamente'
            });

        } catch (error) {
            console.error('. Error en eliminarDocumento:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno al eliminar documento'
            });
        }
    }

/**
 * Evaluar documento con criterios específicos
 */

    /**
     * Evaluar documento con criterios específicos
     */
    static async evaluarDocumento(req, res) {
        try {
            const { documento_id } = req.params;
            const { criterios, comentarios, estado } = req.body;
            
            console.log(`. Evaluando documento ${documento_id}`, { criterios, estado, comentarios });

            // Obtener documento actual usando el modelo
            const documento = await DocumentoModel.obtenerPorId(documento_id);

            if (!documento) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento no encontrado'
                });
            }

            // Calcular scoring basado en criterios aprobados
            const criteriosAprobados = Object.values(criterios).filter(Boolean).length;
            const totalCriterios = Object.keys(criterios).length;
            const porcentajeAprobado = (criteriosAprobados / totalCriterios) * 100;

            // Determinar estado automáticamente si no se proporciona
            let estadoFinal = estado;
            if (!estadoFinal) {
                if (porcentajeAprobado >= 80) {
                    estadoFinal = 'validado';
                } else if (porcentajeAprobado >= 60) {
                    estadoFinal = 'pendiente';
                } else {
                    estadoFinal = 'rechazado';
                }
            }

            // Guardar evaluación usando el modelo
            const evaluacionData = {
                criterios_aprobados: criteriosAprobados,
                total_criterios: totalCriterios,
                porcentaje_aprobado: porcentajeAprobado,
                fecha_evaluacion: new Date().toISOString(),
                criterios_detallados: criterios,
                estado_final: estadoFinal,
                comentarios: comentarios,
                evaluado_por: req.usuario.id
            };

            const condicionAprobacion = await DocumentoModel.registrarEvaluacion({
                solicitud_id: documento.solicitud_id,
                documento_id: documento_id,
                condiciones: evaluacionData,
                creado_por: req.usuario.id,
                created_at: new Date().toISOString()
            });

            // Actualizar documento con información básica de evaluación usando el modelo
            const comentarioEvaluacion = comentarios && comentarios.trim() !== '' 
                ? comentarios 
                : `Evaluación: ${criteriosAprobados}/${totalCriterios} criterios aprobados (${porcentajeAprobado.toFixed(0)}%)`;
            
            const documentoActualizado = await DocumentoModel.actualizar(documento_id, {
                estado: estadoFinal,
                comentarios: comentarioEvaluacion,
                validado_en: new Date().toISOString()
            });


      try {
            // Obtener información de la solicitud para el solicitante
            const { data: solicitudInfo, error: solError } = await supabase
                .from('solicitudes_credito')
                .select('solicitante_id, numero_solicitud')
                .eq('id', documento.solicitud_id)
                .single();

            if (!solError && solicitudInfo) {
                // Crear notificación REAL en la base de datos
                const notificacionData = {
                    usuario_id: solicitudInfo.solicitante_id,
                    solicitud_id: documento.solicitud_id,
                    tipo: 'documento_evaluado',
                    titulo: `Documento ${estadoFinal}`,
                    mensaje: `Tu documento ${documento.tipo} ha sido ${estadoFinal}. ${comentarios ? `Análisis: ${comentarios}` : ''}`,
                    leida: false,
                    datos_adicionales: {
                        documento_tipo: documento.tipo,
                        estado: estadoFinal,
                        comentarios: comentarios,
                        solicitud_numero: solicitudInfo.numero_solicitud,
                        criterios_aprobados: criteriosAprobados,
                        total_criterios: totalCriterios,
                        porcentaje_aprobado: porcentajeAprobado
                    },
                    created_at: new Date().toISOString()
                };

                const { error: notifError } = await supabase
                    .from('notificaciones')
                    .insert([notificacionData]);

                if (notifError) {
                    console.error('. Error creando notificación:', notifError);
                } else {
                    console.log(`📨 Notificación REAL enviada al solicitante sobre documento ${documento.tipo}`);
                }
            }
        } catch (notifError) {
            console.warn('. Error creando notificación:', notifError.message);
            // No fallar la evaluación por error en notificación
        }

        // Recalcular scoring total de la solicitud
        await OperadorController.recalcularScoringSolicitud(documento.solicitud_id);

        // Registrar en auditoría
        await supabase
            .from('auditoria')
            .insert({
                usuario_id: req.usuario.id,
                solicitud_id: documento.solicitud_id,
                accion: 'evaluar_documento',
                detalle: `Documento ${documento.tipo} evaluado: ${estadoFinal} (${porcentajeAprobado.toFixed(0)}%) - ${comentarios || 'Sin comentarios adicionales'}`,
                estado_anterior: documento.estado,
                estado_nuevo: estadoFinal,
                created_at: new Date().toISOString()
            });

        res.json({
            success: true,
            message: 'Documento evaluado exitosamente',
            data: {
                documento: documentoActualizado,
                evaluacion: {
                    criterios_aprobados: criteriosAprobados,
                    total_criterios: totalCriterios,
                    porcentaje_aprobado: porcentajeAprobado,
                    estado: estadoFinal
                }
            }
        });


    } catch (error) {
        console.error('. Error evaluando documento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al evaluar documento'
        });
    }
}
    static async obtenerHistorialEvaluaciones(req, res) {
    try {
        const { documento_id } = req.params;

        const { data: evaluaciones, error } = await supabase
            .from('condiciones_aprobacion')
            .select(`
                *,
                usuario:usuarios!creado_por(nombre_completo, email)
            `)
            .eq('documento_id', documento_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Procesar las evaluaciones para extraer los criterios
      const evaluacionesProcesadas = evaluaciones?.map(evaluacion => {
            // Extraer criterios de la estructura JSONB
            const condiciones = evaluacion.condiciones;
            
            console.log('. Condiciones crudas:', condiciones);
            console.log('. Tipo de condiciones:', typeof condiciones);
            
            // Manejar diferentes formatos de condiciones
            let criteriosDetallados = {};
            
            if (condiciones && typeof condiciones === 'object') {
                // Si condiciones es un objeto con criterios_detallados
                if (condiciones.criterios_detallados && typeof condiciones.criterios_detallados === 'object') {
                    criteriosDetallados = condiciones.criterios_detallados;
                } 
                // Si los criterios están directamente en el objeto principal
                else {
                    // Buscar propiedades booleanas que sean criterios
                    Object.entries(condiciones).forEach(([key, value]) => {
                        if (typeof value === 'boolean') {
                            criteriosDetallados[key] = value;
                        }
                    });
                }
            }
            
            console.log('. Criterios extraídos:', criteriosDetallados);

            return {
                id: evaluacion.id,
                criterios: criteriosDetallados,
                comentarios: condiciones?.comentarios || evaluacion.condiciones?.comentarios,
                estado_final: condiciones?.estado_final,
                porcentaje_aprobado: condiciones?.porcentaje_aprobado,
                fecha_evaluacion: condiciones?.fecha_evaluacion || evaluacion.created_at,
                evaluado_por: evaluacion.usuario
            };
        }) || [];

        res.json({
            success: true,
            data: evaluacionesProcesadas
        });
    } catch (error) {
        console.error('. Error obteniendo historial de evaluaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de evaluaciones'
        });
    }
}

 /**
     * Obtener documentos de contrato para una solicitud
     */
  static async obtenerDocumentosContrato(req, res) {
        try {
            const { solicitud_id } = req.params;
            const usuario = req.usuario;

            console.log(`📄 Obteniendo documentos de contrato para solicitud: ${solicitud_id}`);

            // Verificar permisos según rol
            let query = supabase
                .from('contratos')
                .select(`
                    *,
                    firmas_digitales(
                        id,
                        estado,
                        fecha_firma_completa,
                        url_documento_firmado,
                        ruta_documento
                    )
                `)
                .eq('solicitud_id', solicitud_id);

            // Si es solicitante, verificar que sea el dueño de la solicitud
            if (usuario.rol === 'solicitante') {
                const { data: solicitud } = await supabase
                    .from('solicitudes_credito')
                    .select('solicitante_id')
                    .eq('id', solicitud_id)
                    .single();

                if (!solicitud || solicitud.solicitante_id !== usuario.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para acceder a estos documentos'
                    });
                }
            }

            const { data: contrato, error } = await query.single();

            if (error || !contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    contrato: {
                        id: contrato.id,
                        numero_contrato: contrato.numero_contrato,
                        estado: contrato.estado,
                        ruta_documento: contrato.ruta_documento,
                        fecha_creacion: contrato.created_at
                    },
                    firma: contrato.firmas_digitales?.[0] || null
                }
            });

        } catch (error) {
            console.error('Error obteniendo documentos de contrato:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener documentos del contrato'
            });
        }
    }


static async listarDocumentosStorage(req, res) {
    try {
        const { solicitud_id } = req.params;
        const usuario = req.usuario;

        console.log(`📁 Listando documentos en storage para solicitud: ${solicitud_id}`);

        // Verificar permisos de la solicitud
        const { data: solicitud } = await supabase
            .from('solicitudes_credito')
            .select('solicitante_id, operador_id')
            .eq('id', solicitud_id)
            .single();

        if (!solicitud) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud no encontrada'
            });
        }

        const tienePermiso = (
            usuario.rol === 'operador' || 
            (usuario.rol === 'solicitante' && solicitud.solicitante_id === usuario.id)
        );

        if (!tienePermiso) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver estos documentos'
            });
        }

        // Listar todos los documentos relacionados con la solicitud
        const carpetas = ['contratos', 'contratos-firmados', 'comprobantes-transferencia', 'documentos'];
        let todosDocumentos = [];

        for (const carpeta of carpetas) {
            const { data: archivos, error } = await supabase.storage
                .from('kyc-documents')
                .list(carpeta, {
                    limit: 100,
                    offset: 0,
                    search: solicitud_id
                });

            if (!error && archivos) {
                const documentosConInfo = archivos.map(archivo => ({
                    nombre: archivo.name,
                    carpeta: carpeta,
                    ruta: `${carpeta}/${archivo.name}`,
                    tamaño: archivo.metadata?.size,
                    fecha_actualizacion: archivo.updated_at,
                    tipo: this.obtenerTipoDocumento(archivo.name, carpeta)
                }));
                todosDocumentos = todosDocumentos.concat(documentosConInfo);
            }
        }

        // También buscar en la raíz
        const { data: archivosRaiz, error: errorRaiz } = await supabase.storage
            .from('kyc-documents')
            .list('', {
                limit: 100,
                offset: 0,
                search: solicitud_id
            });

        if (!errorRaiz && archivosRaiz) {
            const documentosRaiz = archivosRaiz
                .filter(archivo => 
                    archivo.name.includes(solicitud_id) &&
                    !archivo.name.startsWith('contratos/') &&
                    !archivo.name.startsWith('contratos-firmados/') &&
                    !archivo.name.startsWith('comprobantes-transferencia/') &&
                    !archivo.name.startsWith('documentos/')
                )
                .map(archivo => ({
                    nombre: archivo.name,
                    carpeta: 'raiz',
                    ruta: archivo.name,
                    tamaño: archivo.metadata?.size,
                    fecha_actualizacion: archivo.updated_at,
                    tipo: this.obtenerTipoDocumento(archivo.name, 'raiz')
                }));
            
            todosDocumentos = todosDocumentos.concat(documentosRaiz);
        }

        // Generar URLs públicas
        const documentosConUrls = todosDocumentos.map(doc => {
            const { data: urlData } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(doc.ruta);
            
            return {
                ...doc,
                url_publica: urlData.publicUrl,
                puede_descargar: true
            };
        });

        res.json({
            success: true,
            data: {
                solicitud_id,
                total_documentos: documentosConUrls.length,
                documentos: documentosConUrls
            }
        });

    } catch (error) {
        console.error('. Error listando documentos storage:', error);
        res.status(500).json({
            success: false,
            message: 'Error al listar documentos'
        });
    }
}

static obtenerTipoDocumento(nombreArchivo, carpeta) {
    if (nombreArchivo.includes('contrato') || carpeta.includes('contrato')) {
        return 'contrato';
    } else if (nombreArchivo.includes('comprobante') || carpeta.includes('comprobante')) {
        return 'comprobante';
    } else if (nombreArchivo.includes('firmado')) {
        return 'documento_firmado';
    } else {
        return 'documento';
    }
}
    /**
     * Obtener comprobantes de transferencia
     */
    static async obtenerComprobantesTransferencia(req, res) {
        try {
            const { solicitud_id } = req.params;
            const usuario = req.usuario;

            console.log(`💰 Obteniendo comprobantes para solicitud: ${solicitud_id}`);

            // Verificar permisos
            let query = supabase
                .from('transferencias_bancarias')
                .select(`
                    *,
                    contactos_bancarios(
                        nombre_banco,
                        numero_cuenta,
                        tipo_cuenta
                    )
                `)
                .eq('solicitud_id', solicitud_id)
                .order('created_at', { ascending: false });

            // Verificar propiedad para solicitantes
            if (usuario.rol === 'solicitante') {
                const { data: solicitud } = await supabase
                    .from('solicitudes_credito')
                    .select('solicitante_id')
                    .eq('id', solicitud_id)
                    .single();

                if (!solicitud || solicitud.solicitante_id !== usuario.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para acceder a estos comprobantes'
                    });
                }
            }

            const { data: transferencias, error } = await query;

            if (error) {
                throw error;
            }

            res.json({
                success: true,
                data: transferencias || []
            });

        } catch (error) {
            console.error('Error obteniendo comprobantes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener comprobantes de transferencia'
            });
        }
    }

    /**
     * Descargar documento de contrato
     */
    static async descargarContrato(req, res) {
        try {
            const { contrato_id } = req.params;
            const usuario = req.usuario;

            console.log(`📥 Descargando contrato: ${contrato_id}`);

            // Obtener información del contrato
            const { data: contrato, error: contratoError } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', contrato_id)
                .single();

            if (contratoError || !contrato) {
                return res.status(404).json({
                    success: false,
                    message: 'Contrato no encontrado'
                });
            }

            // Verificar permisos
            const solicitud = contrato.solicitudes_credito;
            if (usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para descargar este contrato'
                });
            }

            if (usuario.rol === 'operador' && solicitud.operador_id !== usuario.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para descargar este contrato'
                });
            }

            // Determinar qué documento descargar (original o firmado)
            let rutaDescarga = contrato.ruta_documento;

            // Si existe firma digital con documento firmado, usar ese
            if (contrato.firma_digital_id) {
                const { data: firma } = await supabase
                    .from('firmas_digitales')
                    .select('url_documento_firmado, ruta_documento')
                    .eq('id', contrato.firma_digital_id)
                    .single();

                if (firma && (firma.url_documento_firmado || firma.ruta_documento)) {
                    rutaDescarga = firma.url_documento_firmado || firma.ruta_documento;
                }
            }

            if (!rutaDescarga) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento del contrato no disponible'
                });
            }

            // Descargar archivo
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('kyc-documents')
                .download(rutaDescarga);

            if (downloadError) {
                console.error('Error descargando contrato:', downloadError);
                return res.status(404).json({
                    success: false,
                    message: 'Error al descargar el documento'
                });
            }

            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Determinar tipo de archivo y nombre
            const esWord = rutaDescarga.toLowerCase().endsWith('.docx');
            const contentType = esWord 
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                : 'application/pdf';
            
            const extension = esWord ? 'docx' : 'pdf';
            const nombreArchivo = `contrato-${contrato.numero_contrato}.${extension}`;

            // Configurar headers para descarga
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Cache-Control', 'no-cache');

            console.log(`. Contrato descargado: ${nombreArchivo}`);
            res.send(buffer);

        } catch (error) {
            console.error('Error descargando contrato:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno al descargar contrato'
            });
        }
    }

    /**
     * Descargar comprobante de transferencia
     */
    static async descargarComprobante(req, res) {
        try {
            const { transferencia_id } = req.params;
            const usuario = req.usuario;

            console.log(`📥 Descargando comprobante: ${transferencia_id}`);

            // Obtener información de la transferencia
            const { data: transferencia, error: transferenciaError } = await supabase
                .from('transferencias_bancarias')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', transferencia_id)
                .single();

            if (transferenciaError || !transferencia) {
                return res.status(404).json({
                    success: false,
                    message: 'Transferencia no encontrada'
                });
            }

            // Verificar permisos
            const solicitud = transferencia.solicitudes_credito;
            if (usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para descargar este comprobante'
                });
            }

            if (usuario.rol === 'operador' && solicitud.operador_id !== usuario.id) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para descargar este comprobante'
                });
            }

            if (!transferencia.ruta_comprobante) {
                return res.status(404).json({
                    success: false,
                    message: 'Comprobante no disponible para esta transferencia'
                });
            }

            // Descargar archivo
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('kyc-documents')
                .download(transferencia.ruta_comprobante);

            if (downloadError) {
                console.error('Error descargando comprobante:', downloadError);
                return res.status(404).json({
                    success: false,
                    message: 'Error al descargar el comprobante'
                });
            }

            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const nombreArchivo = `comprobante-${transferencia.numero_comprobante}.pdf`;

            // Configurar headers para descarga
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Cache-Control', 'no-cache');

            console.log(`. Comprobante descargado: ${nombreArchivo}`);
            res.send(buffer);

        } catch (error) {
            console.error('Error descargando comprobante:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno al descargar comprobante'
            });
        }
    }

    /**
     * Vista previa de documento (sin descarga)
     */
    static async verDocumento(req, res) {
        try {
            const { tipo, id } = req.params;
            const usuario = req.usuario;

            console.log(`👁️ Vista previa de documento: ${tipo} - ${id}`);

            let rutaDocumento;
            let nombreDocumento;

            if (tipo === 'contrato') {
                const { data: contrato } = await supabase
                    .from('contratos')
                    .select(`
                        *,
                        solicitudes_credito(
                            solicitante_id,
                            operador_id
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (!contrato) {
                    return res.status(404).json({
                        success: false,
                        message: 'Contrato no encontrado'
                    });
                }

                // Verificar permisos
                const solicitud = contrato.solicitudes_credito;
                if (usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para ver este documento'
                    });
                }

                rutaDocumento = contrato.ruta_documento;
                nombreDocumento = `contrato-${contrato.numero_contrato}`;

            } else if (tipo === 'comprobante') {
                const { data: transferencia } = await supabase
                    .from('transferencias_bancarias')
                    .select(`
                        *,
                        solicitudes_credito(
                            solicitante_id,
                            operador_id
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (!transferencia) {
                    return res.status(404).json({
                        success: false,
                        message: 'Transferencia no encontrada'
                    });
                }

                // Verificar permisos
                const solicitud = transferencia.solicitudes_credito;
                if (usuario.rol === 'solicitante' && solicitud.solicitante_id !== usuario.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para ver este documento'
                    });
                }

                rutaDocumento = transferencia.ruta_comprobante;
                nombreDocumento = `comprobante-${transferencia.numero_comprobante}`;

            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de documento no válido'
                });
            }

            if (!rutaDocumento) {
                return res.status(404).json({
                    success: false,
                    message: 'Documento no disponible'
                });
            }

            // Obtener URL pública para vista previa
            const { data: urlData } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(rutaDocumento);

            res.json({
                success: true,
                data: {
                    url: urlData.publicUrl,
                    nombre: nombreDocumento,
                    tipo: tipo
                }
            });

        } catch (error) {
            console.error('Error en vista previa de documento:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar el documento'
            });
        }
    }
    /**
 * Obtener mis solicitudes con documentos disponibles
 */
static async obtenerMisSolicitudesConDocumentos(req, res) {
  try {
    const usuario_id = req.usuario.id;
    const usuario_rol = req.usuario.rol;

    console.log(`📋 Obteniendo solicitudes con documentos para: ${usuario_id} (${usuario_rol})`);

    let solicitudes;

    if (usuario_rol === 'solicitante') {
      // CORRECCIÓN: Obtener solicitudes aprobadas del solicitante
      const { data: solicitudesData, error } = await supabase
        .from('solicitudes_credito')
        .select(`
          *,
          contratos(*),
          transferencias_bancarias(*),
          solicitantes: solicitantes!solicitante_id(
            usuarios(nombre_completo, email)
          )
        `)
        .eq('solicitante_id', usuario_id)
        .eq('estado', 'aprobado')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error en consulta de solicitante:', error);
        throw error;
      }

      solicitudes = solicitudesData || [];

      // ✅ CORRECCIÓN CRÍTICA: Obtener firmas digitales para TODOS los contratos
      if (solicitudes.length > 0) {
        const contratosIds = [];
        
        // Recopilar todos los IDs de contratos
        solicitudes.forEach(solicitud => {
          if (solicitud.contratos && Array.isArray(solicitud.contratos)) {
            solicitud.contratos.forEach(contrato => {
              if (contrato.id) contratosIds.push(contrato.id);
            });
          } else if (solicitud.contratos && solicitud.contratos.id) {
            contratosIds.push(solicitud.contratos.id);
          }
        });

        if (contratosIds.length > 0) {
          console.log(`🔍 Buscando firmas para ${contratosIds.length} contratos`);
          
          // Obtener firmas digitales para todos los contratos
          const { data: firmasDigitales, error: firmasError } = await supabase
            .from('firmas_digitales')
            .select('*')
            .in('contrato_id', contratosIds);

          if (firmasError) {
            console.error('❌ Error obteniendo firmas digitales:', firmasError);
          } else {
            console.log(`✅ Encontradas ${firmasDigitales?.length || 0} firmas digitales`);
            
            // Asociar firmas a sus contratos correspondientes
            solicitudes = solicitudes.map(solicitud => {
              if (solicitud.contratos) {
                const contratosActualizados = Array.isArray(solicitud.contratos) 
                  ? solicitud.contratos.map(contrato => {
                      const firmaAsociada = firmasDigitales?.find(firma => firma.contrato_id === contrato.id);
                      return {
                        ...contrato,
                        firma_digital: firmaAsociada || null
                      };
                    })
                  : [{
                      ...solicitud.contratos,
                      firma_digital: firmasDigitales?.find(firma => firma.contrato_id === solicitud.contratos.id) || null
                    }];
                
                return {
                  ...solicitud,
                  contratos: contratosActualizados
                };
              }
              return solicitud;
            });
          }
        }
      }

    } else if (usuario_rol === 'operador') {
      // Para operadores: obtener todas las solicitudes aprobadas
      const { data, error } = await supabase
        .from('solicitudes_credito')
        .select(`
          *,
          contratos(*, firmas_digitales(*)),
          transferencias_bancarias(*),
          solicitantes: solicitantes!solicitante_id(
            usuarios(nombre_completo, email)
          ),
          operadores: operadores!operador_id(
            usuarios(nombre_completo, email)
          )
        `)
        .eq('estado', 'aprobado')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error en consulta de operador:', error);
        throw error;
      }

      solicitudes = data || [];
    } else {
      return res.status(403).json({
        success: false,
        message: 'Rol no autorizado'
      });
    }

    console.log(`✅ Encontradas ${solicitudes?.length || 0} solicitudes con documentos`);

    res.json({
      success: true,
      data: solicitudes || []
    });

  } catch (error) {
    console.error('❌ Error obteniendo solicitudes con documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes con documentos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

static async obtenerTodosLosDocumentos(req, res) {
  try {
    const usuario = req.usuario;
    
    console.log('. Obteniendo todos los documentos para operador:', usuario.id);

    // Verificar que sea operador
    if (usuario.rol !== 'operador') {
      return res.status(403).json({
        success: false,
        message: 'Solo los operadores pueden acceder a todos los documentos'
      });
    }

    // CONSULTA .: Obtener contratos con información completa
    const { data: contratos, error: errorContratos } = await supabase
      .from('contratos')
      .select(`
        *,
        solicitudes_credito!inner(
          id,
          numero_solicitud,
          monto,
          moneda,
          estado,
          solicitante_id,
          solicitantes!solicitante_id(
            id,
            nombre_empresa,
            usuarios(
              id,
              nombre_completo,
              email,
              dni
            )
          )
        ),
        firmas_digitales(
          id,
          estado,
          fecha_firma_completa,
          url_documento_firmado,
          ruta_documento
        )
      `)
      .order('created_at', { ascending: false });

    if (errorContratos) {
      console.error('Error obteniendo contratos:', errorContratos);
      throw errorContratos;
    }

    // Obtener transferencias con información completa
    const { data: transferencias, error: errorTransferencias } = await supabase
      .from('transferencias_bancarias')
      .select(`
        *,
        solicitudes_credito!inner(
          id,
          numero_solicitud,
          monto,
          moneda,
          solicitante_id,
          solicitantes!solicitante_id(
            id,
            nombre_empresa,
            usuarios(
              id,
              nombre_completo,
              email
            )
          )
        ),
        contactos_bancarios(
          nombre_banco,
          numero_cuenta,
          tipo_cuenta
        )
      `)
      .order('created_at', { ascending: false });

    if (errorTransferencias) {
      console.error('Error obteniendo transferencias:', errorTransferencias);
      throw errorTransferencias;
    }

    // Formatear respuesta de manera más robusta
    const documentosFormateados = {
      contratos: (contratos || []).map(contrato => ({
        id: contrato.id,
        tipo: 'contrato',
        numero_contrato: contrato.numero_contrato,
        estado: contrato.estado,
        ruta_documento: contrato.ruta_documento,
        monto: contrato.monto_aprobado,
        moneda: contrato.moneda || 'USD',
        created_at: contrato.created_at,
        updated_at: contrato.updated_at,
        numero_solicitud: contrato.solicitudes_credito?.numero_solicitud,
        solicitante_nombre: contrato.solicitudes_credito?.solicitantes?.usuarios?.nombre_completo,
        firma_digital: contrato.firmas_digitales?.[0] || null
      })),
      transferencias: (transferencias || []).map(transferencia => ({
        id: transferencia.id,
        tipo: 'comprobante',
        numero_comprobante: transferencia.numero_comprobante,
        estado: transferencia.estado,
        ruta_comprobante: transferencia.ruta_comprobante,
        monto: transferencia.monto,
        moneda: transferencia.moneda,
        fecha_procesamiento: transferencia.fecha_procesamiento,
        fecha_completada: transferencia.fecha_completada,
        banco_destino: transferencia.banco_destino,
        cuenta_destino: transferencia.cuenta_destino,
        numero_solicitud: transferencia.solicitudes_credito?.numero_solicitud,
        solicitante_nombre: transferencia.solicitudes_credito?.solicitantes?.usuarios?.nombre_completo,
        contacto_bancario: transferencia.contactos_bancarios
      }))
    };

    console.log(`. Documentos cargados: ${documentosFormateados.contratos.length} contratos, ${documentosFormateados.transferencias.length} transferencias`);

    res.json({
      success: true,
      data: documentosFormateados
    });

  } catch (error) {
    console.error('. Error obteniendo todos los documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos: ' + error.message
    });
  }
}
}

module.exports = DocumentoController;