const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const diditService = require('../servicios/diditService');

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

    console.log('📁 Datos recibidos:', { solicitud_id, tipo, archivo: archivo ? archivo.originalname : 'NO ARCHIVO' });

    if (!solicitud_id || !tipo || !archivo) {
      return res.status(400).json({
        success: false,
        message: 'Solicitud ID, tipo y archivo son requeridos'
      });
    }

    console.log(`📤 Subiendo documento ${tipo} para solicitud: ${solicitud_id}`);

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
    
    console.log('📤 Subiendo a storage:', rutaStorage);

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

      console.log('🔄 Aplicando OCR...');
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

  static async iniciarVerificacionDidit(solicitudId, documentoId, archivoBuffer) {
    try {
      console.log(`🔐 Iniciando verificación Didit para documento: ${documentoId}`);
      
      const resultado = await diditService.verifyIdentity(archivoBuffer);
      
      if (resultado.success) {
        const estadoDocumento = (resultado.data.id_verification?.status === 'Approved') ? 'validado' : 'rechazado';
        
        await supabase
          .from('documentos')
          .update({
            estado: estadoDocumento,
            comentarios: `Verificación Didit: ${resultado.data.id_verification?.status}`,
            validado_en: new Date().toISOString()
          })
          .eq('id', documentoId);

        // Guardar en verificaciones_kyc
        await DocumentoController.guardarVerificacionKYC(solicitudId, resultado);
        
        console.log(`. Verificación Didit completada: ${estadoDocumento}`);
      }
    } catch (error) {
      console.error('. Error en verificación Didit:', error);
    }
  }

  static async guardarVerificacionKYC(solicitudId, resultado) {
    try {
      const verificacionData = {
        solicitud_id: solicitudId,
        session_id: resultado.data.session_id || `didit_${Date.now()}`,
        proveedor: 'didit',
        estado: (resultado.data.id_verification?.status || 'approved').toLowerCase(),
        datos_verificacion: resultado.data,
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
}

module.exports = DocumentoController;