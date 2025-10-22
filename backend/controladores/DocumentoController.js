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
    const { solicitud_id, tipo } = req.body;
    const archivo = req.file;

    console.log('. Datos recibidos:', { solicitud_id, tipo, archivo: archivo ? archivo.originalname : 'NO ARCHIVO' });

    if (!solicitud_id || !tipo || !archivo) {
      return res.status(400).json({
        success: false,
        message: 'Solicitud ID, tipo y archivo son requeridos'
      });
    }

    console.log(`. Subiendo documento ${tipo} para solicitud: ${solicitud_id}`);

    // Validaciones
    const tiposPermitidos = ['dni', 'cuit', 'comprobante_domicilio', 'balance_contable', 'estado_financiero', 'declaracion_impuestos'];
    if (!tiposPermitidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de documento no válido. Permitidos: ${tiposPermitidos.join(', ')}`
      });
    }

    // Subir a supabase storage
    const nombreArchivo = await DocumentoController.subirArchivoStorage(archivo, solicitud_id, tipo);
    const rutaStorage = `documentos/${solicitud_id}/${nombreArchivo}`;
    
    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(rutaStorage);

    // Extraer información del documento - .: usar await y manejar correctamente
    let informacionExtraida = null;
    if (archivo.originalname.toLowerCase().endsWith('.pdf')) {
      informacionExtraida = await DocumentoController.extraerInformacionDocumento(urlData.publicUrl, tipo, archivo.buffer);
    }

    // Guardar en base de datos - .: construir objeto correctamente
    const documentoData = {
      solicitud_id,
      tipo,
      nombre_archivo: nombreArchivo,
      ruta_storage: rutaStorage,
      tamanio_bytes: archivo.size,
      estado: 'pendiente',
      informacion_extraida: informacionExtraida, // .: usar la variable definida
      created_at: new Date().toISOString()
    };

    const { data: documento, error: docError } = await supabase
      .from('documentos')
      .insert([documentoData])
      .select()
      .single();

    if (docError) {
      console.error('. Error guardando documento en BD:', docError);
      throw docError;
    }

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
        url_publica: urlData.publicUrl,
        informacion_extraida: informacionExtraida // .: usar la variable definida
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
    
    // Asegurar que siempre retorne un valor válido
    const informacionExtraida = DocumentoController.extraerInformacionEspecifica(tipo, texto);
    return informacionExtraida || null; // Siempre retornar null si no hay información
    
  } catch (error) {
    console.warn('. No se pudo extraer información del documento:', error.message);
    return null; // Siempre retornar null en caso de error
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
      console.log('📝 Texto no válido para extracción');
      return null;
    }

    console.log(`. Extrayendo información para tipo: ${tipo}`);
    console.log(`📝 Texto disponible (primeros 300 chars): ${texto.substring(0, 300)}...`);

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
      
      const { data: documentos, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('solicitud_id', solicitud_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      const { data: documento, error } = await supabase
        .from('documentos')
        .update({
          estado,
          comentarios,
          validado_en: new Date().toISOString()
        })
        .eq('id', documento_id)
        .select()
        .single();

      if (error) throw error;

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

  // Descargar documento
  static async descargarDocumento(req, res) {
    try {
      const { documento_id } = req.params;
      
      console.log(`. Descargando documento: ${documento_id}`);

      // Obtener información del documento
      const { data: documento, error: docError } = await supabase
        .from('documentos')
        .select('*')
        .eq('id', documento_id)
        .single();

      if (docError || !documento) {
        return res.status(404).json({
          success: false,
          message: 'Documento no encontrado'
        });
      }

      // Verificar permisos
      if (req.usuario.rol === 'solicitante') {
        const { data: solicitud, error: solError } = await supabase
          .from('solicitudes_credito')
          .select('solicitante_id')
          .eq('id', documento.solicitud_id)
          .single();

        if (solError || solicitud.solicitante_id !== req.usuario.id) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para acceder a este documento'
          });
        }
      }

      // Descargar archivo
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('kyc-documents')
        .download(documento.ruta_storage);

      if (downloadError) {
        console.error('. Error descargando archivo:', downloadError);
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado en storage'
        });
      }

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
  // Actualizar documento existente
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

    // Obtener documento actual
    const { data: documentoActual, error: docError } = await supabase
      .from('documentos')
      .select('*')
      .eq('id', documento_id)
      .single();

    if (docError || !documentoActual) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    console.log(`.Actualizando documento ${tipo} con ID: ${documento_id}`);

    // Eliminar archivo anterior del storage
    try {
      const { error: deleteError } = await supabase.storage
        .from('kyc-documents')
        .remove([documentoActual.ruta_storage]);

      if (deleteError) {
        console.warn('. No se pudo eliminar archivo anterior:', deleteError.message);
      } else {
        console.log('. Archivo anterior eliminado:', documentoActual.ruta_storage);
      }
    } catch (storageError) {
      console.warn('. Error eliminando archivo anterior:', storageError.message);
    }

    // Subir nuevo archivo
    const nombreArchivo = await DocumentoController.subirArchivoStorage(archivo, documentoActual.solicitud_id, tipo);
    const rutaStorage = `documentos/${documentoActual.solicitud_id}/${nombreArchivo}`;
    
    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(rutaStorage);

    // Extraer información del nuevo documento
    let informacionExtraida = null;
    if (archivo.originalname.toLowerCase().endsWith('.pdf')) {
      informacionExtraida = await DocumentoController.extraerInformacionDocumento(urlData.publicUrl, tipo, archivo.buffer);
    }

    // Actualizar documento en base de datos
    const documentoData = {
      tipo,
      nombre_archivo: nombreArchivo,
      ruta_storage: rutaStorage,
      tamanio_bytes: archivo.size,
      estado: 'pendiente', // Resetear estado a pendiente
      informacion_extraida: informacionExtraida,
      validado_en: null,
      comentarios: null,
      updated_at: new Date().toISOString()
    };

    const { data: documento, error: updateError } = await supabase
      .from('documentos')
      .update(documentoData)
      .eq('id', documento_id)
      .select()
      .single();

    if (updateError) {
      console.error('. Error actualizando documento en BD:', updateError);
      throw updateError;
    }

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
        url_publica: urlData.publicUrl,
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
// Eliminar documento
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

    // Obtener documento
    const { data: documento, error: docError } = await supabase
      .from('documentos')
      .select('*')
      .eq('id', documento_id)
      .single();

    if (docError || !documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Eliminar archivo del storage
    try {
      const { error: deleteError } = await supabase.storage
        .from('kyc-documents')
        .remove([documento.ruta_storage]);

      if (deleteError) {
        console.warn('. No se pudo eliminar archivo:', deleteError.message);
      } else {
        console.log('. Archivo eliminado:', documento.ruta_storage);
      }
    } catch (storageError) {
      console.warn('. Error eliminando archivo:', storageError.message);
    }

    // Eliminar registro de la base de datos
    const { error: deleteDbError } = await supabase
      .from('documentos')
      .delete()
      .eq('id', documento_id);

    if (deleteDbError) {
      throw deleteDbError;
    }

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
static async evaluarDocumento(req, res) {
    try {
        const { documento_id } = req.params;
        const { criterios, comentarios, estado } = req.body;
        
        console.log(`. Evaluando documento ${documento_id}`, { criterios, estado, comentarios });

        // Obtener documento actual
        const { data: documento, error: docError } = await supabase
            .from('documentos')
            .select('*')
            .eq('id', documento_id)
            .single();

        if (docError || !documento) {
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

        const comentarioEvaluacion = `Evaluación: ${criteriosAprobados}/${totalCriterios} criterios aprobados (${porcentajeAprobado.toFixed(0)}%). ${comentarios || ''}`;
        const informacionEvaluacion = {
            ...(documento.informacion_extraida || {}), // Mantener información existente
            evaluacion: {
                criterios_aprobados: criteriosAprobados,
                total_criterios: totalCriterios,
                porcentaje_aprobado: porcentajeAprobado,
                fecha_evaluacion: new Date().toISOString(),
                criterios_detallados: criterios,
                estado_final: estadoFinal,
                comentarios: comentarios
            }
        };

        // Actualizar documento
        const { data: documentoActualizado, error: updateError } = await supabase
            .from('documentos')
            .update({
                estado: estadoFinal,
                comentarios: comentarioEvaluacion,
                validado_en: new Date().toISOString(),
                informacion_extraida: informacionEvaluacion // GUARDAR EVALUACIÓN
            })
            .eq('id', documento_id)
            .select()
            .single();

        if (updateError) throw updateError;


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
                    mensaje: `Tu documento ${documento.tipo} ha sido ${estadoFinal}. ${comentarios ? `Comentarios: ${comentarios}` : ''}`,
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
}

module.exports = DocumentoController;