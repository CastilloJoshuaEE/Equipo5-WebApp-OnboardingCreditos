const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');
const diditService = require('../servicios/diditService');

// Importar pdfjs-dist legacy para Node.js
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// AGREGAR DEPENDENCIAS DE OCR AL INICIO
const Tesseract = require('tesseract.js');
const { createCanvas } = require('canvas');

// Subir documento KYC
const subirDocumento = async (req, res) => {
  try {
    const { solicitud_id, tipo } = req.body;
    const archivo = req.file;

    if (!solicitud_id || !tipo || !archivo) {
      return res.status(400).json({
        success: false,
        message: 'Solicitud ID, tipo y archivo son requeridos'
      });
    }

    console.log(`. Subiendo documento ${tipo} para solicitud: ${solicitud_id}`);

    // Validar tipo de documento
    const tiposPermitidos = ['dni', 'cuit', 'comprobante_domicilio', 'balance_contable', 'estado_financiero', 'declaracion_impuestos'];
    if (!tiposPermitidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de documento no válido. Permitidos: ${tiposPermitidos.join(', ')}`
      });
    }

    // Validar formato de archivo
    const formatosPermitidos = ['.pdf', '.jpg', '.jpeg', '.png'];
    const extension = archivo.originalname.toLowerCase().split('.').pop();
    if (!formatosPermitidos.includes(`.${extension}`)) {
      return res.status(400).json({
        success: false,
        message: `Formato de archivo no válido. Permitidos: ${formatosPermitidos.join(', ')}`
      });
    }

    // Subir a Supabase Storage
    const nombreArchivo = `${solicitud_id}_${tipo}_${Date.now()}.${extension}`;
    const rutaStorage = `documentos/${solicitud_id}/${nombreArchivo}`;

    console.log('. Intentando subir archivo a:', rutaStorage);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(rutaStorage, archivo.buffer, {
        contentType: archivo.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('. Error subiendo archivo:', uploadError);
      
      // Mensajes de error más específicos
      if (uploadError.message.includes('Bucket not found')) {
        return res.status(500).json({
          success: false,
          message: 'El bucket kyc-documents no existe. Contacte al administrador.'
        });
      }
      
      if (uploadError.message.includes('policy') || uploadError.message.includes('permission')) {
        return res.status(500).json({
          success: false,
          message: 'Error de permisos. No tiene autorización para subir archivos.'
        });
      }
      
      if (uploadError.message.includes('duplicate')) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un archivo con ese nombre. Intente con un nombre diferente.'
        });
      }
      
      throw uploadError;
    }

    console.log('. Archivo subido exitosamente');

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(rutaStorage);

    console.log('. URL pública generada:', urlData.publicUrl);

    // Extraer información del PDF usando la URL pública de Supabase
    let informacionExtraida = null;
    if (extension === 'pdf') {
      try {
        console.log('. Intentando extraer texto del PDF desde URL pública...');
        
        // MODIFICACIÓN: Pasar el tipo para decidir si usar OCR
        const texto = await extraerTextoDePDFDesdeURL(urlData.publicUrl, tipo);
        
        if (texto && texto.trim().length > 0) {
          informacionExtraida = extraerInformacionPDF(tipo, texto);
          console.log('. Información extraída del PDF:', informacionExtraida);
        } else {
          console.log('. No se pudo extraer texto del PDF');
          informacionExtraida = null;
        }
      } catch (parseError) {
        console.warn('. No se pudo extraer información del PDF:', parseError.message);
        informacionExtraida = null;
      }
    }

    // Guardar en base de datos
    const documentoData = {
      solicitud_id,
      tipo,
      nombre_archivo: nombreArchivo,
      ruta_storage: rutaStorage,
      tamanio_bytes: archivo.size,
      estado: 'pendiente',
      created_at: new Date().toISOString()
    };

    // Solo agregar informacion_extraida si existe
    if (informacionExtraida) {
      try {
        documentoData.informacion_extraida = informacionExtraida;
      } catch (error) {
        console.warn('. Columna informacion_extraida no disponible, omitiendo...');
      }
    }

    const { data: docData, error: docError } = await supabase
      .from('documentos')
      .insert([documentoData])
      .select();

    if (docError) {
      console.error('. Error guardando documento en BD:', docError);
      
      // Si el error es por la columna informacion_extraida, intentar sin ella
      if (docError.message.includes('informacion_extraida')) {
        console.log('. Intentando guardar sin informacion_extraida...');
        delete documentoData.informacion_extraida;
        
        const { data: docDataRetry, error: docErrorRetry } = await supabase
          .from('documentos')
          .insert([documentoData])
          .select();
          
        if (docErrorRetry) {
          throw docErrorRetry;
        }
        
        console.log(`. Documento ${tipo} guardado en BD con ID:`, docDataRetry[0].id);
        
        // Si es DNI, iniciar verificación automática con Didit
        if (tipo === 'dni') {
          await iniciarVerificacionDidit(solicitud_id, docDataRetry[0].id, archivo.buffer);
        }

        return res.status(201).json({
          success: true,
          message: 'Documento subido exitosamente',
          data: {
            documento: docDataRetry[0],
            url_publica: urlData.publicUrl,
            informacion_extraida: informacionExtraida
          }
        });
      }
      
      // Intentar eliminar el archivo subido si falla la BD
      try {
        await supabase.storage
          .from('kyc-documents')
          .remove([rutaStorage]);
      } catch (deleteError) {
        console.warn('. No se pudo eliminar archivo huérfano:', deleteError.message);
      }
      
      throw docError;
    }

    console.log(`. Documento ${tipo} guardado en BD con ID:`, docData[0].id);

    // Si es DNI, iniciar verificación automática con Didit
    if (tipo === 'dni') {
      await iniciarVerificacionDidit(solicitud_id, docData[0].id, archivo.buffer);
    }

    res.status(201).json({
      success: true,
      message: 'Documento subido exitosamente',
      data: {
        documento: docData[0],
        url_publica: urlData.publicUrl,
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
};

// FUNCIÓN MEJORADA PARA EXTRAER TEXTO DE PDF CON OCR
const extraerTextoDePDFDesdeURL = async (pdfUrl, tipo = 'general') => {
  try {
    console.log('. Extrayendo texto desde URL:', pdfUrl);
    
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    
    console.log(`. PDF cargado. Número de páginas: ${pdf.numPages}`);
    
    let fullText = '';
    
    // Extraer texto de cada página
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
      
      console.log(`. Página ${i} extraída, longitud: ${pageText.length} caracteres`);
    }
    
    // SI ES DNI Y NO HAY TEXTO, USAR OCR
    if (tipo === 'dni' && fullText.trim().length < 10) {
      console.log('. DNI sin texto extraíble, aplicando OCR...');
      const textoOCR = await procesarDNIconOCR(pdfUrl);
      
      if (textoOCR && textoOCR.trim().length > 0) {
        console.log(`. OCR exitoso. Texto obtenido: ${textoOCR.length} caracteres`);
        return textoOCR;
      }
    }
    
    if (fullText.trim().length > 0) {
      console.log(`. Texto extraído exitosamente. Longitud: ${fullText.length} caracteres`);
      return fullText;
    } else {
      console.warn('. PDF no contiene texto extraíble');
      return '';
    }
    
  } catch (error) {
    console.error('. Error extrayendo texto:', error.message);
    return '';
  }
};

// FUNCIÓN OCR PARA DNI
const procesarDNIconOCR = async (pdfUrl) => {
  try {
    console.log('. Iniciando OCR para DNI...');
    
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
    
    console.log('. Página renderizada, aplicando OCR...');
    
    const { data: { text } } = await Tesseract.recognize(
      canvas.toBuffer(),
      'spa',
      { 
        logger: m => console.log('. Progreso OCR:', m.status),
        tessedit_pageseg_mode: '6'
      }
    );
    
    return text && text.trim().length > 0 ? text : null;
    
  } catch (error) {
    console.error('. Error en OCR:', error.message);
    return null;
  }
};

// Función alternativa para extraer desde buffer (como backup)
const extraerTextoDePDFDesdeBuffer = async (buffer) => {
  try {
    console.log('. Extrayendo texto desde buffer con pdfjs-dist...');
    
    // Convertir buffer a Uint8Array
    const uint8Array = new Uint8Array(buffer);
    
    const loadingTask = pdfjsLib.getDocument(uint8Array);
    const pdf = await loadingTask.promise;
    
    console.log(`. PDF cargado desde buffer. Número de páginas: ${pdf.numPages}`);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    if (fullText.trim().length > 0) {
      console.log(`. Texto extraído desde buffer. Longitud: ${fullText.length} caracteres`);
      return fullText;
    } else {
      return 'Documento PDF sin texto extraíble desde buffer';
    }
    
  } catch (error) {
    console.error('. Error extrayendo desde buffer:', error.message);
    return 'Error en extracción de texto desde buffer';
  }
};

// Extraer información específica de PDF según tipo - MEJORADA
const extraerInformacionPDF = (tipo, texto) => {
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
        // Patrones mejorados para DNI argentino
        const dniMatch = texto.match(/(\d{1,2}\.?\d{3}\.?\d{3})|(\d{7,8})/g);
        if (dniMatch) {
          // Tomar el primer match y limpiar puntos
          informacion.numero_documento = dniMatch[0].replace(/\./g, '');
        }
        
        // Buscar nombres y apellidos con patrones más flexibles
        const lineas = texto.split('\n').filter(linea => linea.trim().length > 2);
        
        for (let i = 0; i < lineas.length; i++) {
          const linea = lineas[i].toLowerCase();
          
          if ((linea.includes('apellido') || linea.includes('apellidos')) && i + 1 < lineas.length) {
            informacion.apellido = lineas[i + 1].trim();
          }
          
          if ((linea.includes('nombre') || linea.includes('nombres')) && i + 1 < lineas.length) {
            informacion.nombres = lineas[i + 1].trim();
          }
          
          if ((linea.includes('fecha') && linea.includes('nac')) || linea.includes('nacimiento')) {
            const fechaMatch = lineas[i + 1]?.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
            if (fechaMatch) informacion.fecha_nacimiento = fechaMatch[0];
          }
          
          // Buscar domicilio
          if (linea.includes('domicilio') || linea.includes('dirección') || linea.includes('direccion')) {
            if (i + 1 < lineas.length && lineas[i + 1].trim().length > 5) {
              informacion.domicilio = lineas[i + 1].trim();
            }
          }
        }
        break;

      case 'cuit':
        // Buscar CUIT con diferentes formatos
        const cuitMatch = texto.match(/(\d{2}[\-\s]?\d{8}[\-\s]?\d{1})/);
        if (cuitMatch) {
          informacion.cuit = cuitMatch[0].replace(/\s/g, '-');
        }
        
        // Buscar razón social
        const razonMatch = texto.match(/(Razón Social|Razon Social|RAZON SOCIAL|Razón|Empresa|Nombre)[:\s]*([^\n\r]+)/i);
        if (razonMatch && razonMatch[2]) {
          informacion.razon_social = razonMatch[2].trim();
        }
        
        // Buscar actividad
        const actividadMatch = texto.match(/(Actividad|Rubro|Giro)[:\s]*([^\n\r]+)/i);
        if (actividadMatch && actividadMatch[2]) {
          informacion.actividad = actividadMatch[2].trim();
        }
        
        // Buscar domicilio fiscal
        const domicilioFiscalMatch = texto.match(/(Domicilio Fiscal|Domicilio|Dirección)[:\s]*([^\n\r]+)/i);
        if (domicilioFiscalMatch && domicilioFiscalMatch[2]) {
          informacion.domicilio_fiscal = domicilioFiscalMatch[2].trim();
        }
        break;

      case 'comprobante_domicilio':
        // Buscar información en comprobantes
        const clienteMatch = texto.match(/(Cliente|Titular|Usuario)[:\s]*([^\n\r]+)/i);
        if (clienteMatch && clienteMatch[2]) {
          informacion.cliente = clienteMatch[2].trim();
        }
        
        const direccionMatch = texto.match(/(Domicilio|Dirección|Calle)[:\s]*([^\n\r]+)/i);
        if (direccionMatch && direccionMatch[2]) {
          informacion.domicilio = direccionMatch[2].trim();
        }
        
        const periodoMatch = texto.match(/(Per[ií]odo|Mes|Facturación)[:\s]*([^\n\r]+)/i);
        if (periodoMatch && periodoMatch[2]) {
          informacion.periodo = periodoMatch[2].trim();
        }
        
        const importeMatch = texto.match(/(Importe|Total|Monto)[:\s]*\$?\s*([\d.,]+)/i);
        if (importeMatch && importeMatch[2]) {
          informacion.importe = importeMatch[2];
        }
        break;

      case 'balance_contable':
        const activoMatch = texto.match(/(TOTAL ACTIVO|ACTIVO TOTAL)[:\s]*\$?\s*([\d.,]+)/i);
        if (activoMatch && activoMatch[2]) {
          informacion.total_activo = parseFloat(activoMatch[2].replace(/[^\d.]/g, ''));
        }
        
        const pasivoMatch = texto.match(/(TOTAL PASIVO|PASIVO TOTAL)[:\s]*\$?\s*([\d.,]+)/i);
        if (pasivoMatch && pasivoMatch[2]) {
          informacion.total_pasivo = parseFloat(pasivoMatch[2].replace(/[^\d.]/g, ''));
        }
        
        const patrimonioMatch = texto.match(/(TOTAL PATRIMONIO NETO|PATRIMONIO NETO)[:\s]*\$?\s*([\d.,]+)/i);
        if (patrimonioMatch && patrimonioMatch[2]) {
          informacion.total_patrimonio = parseFloat(patrimonioMatch[2].replace(/[^\d.]/g, ''));
        }
        break;

      case 'declaracion_impuestos':
        const periodoDeclaracionMatch = texto.match(/(Per[ií]odo|Ejercicio)[:\s]*([^\n\r]+)/i);
        if (periodoDeclaracionMatch && periodoDeclaracionMatch[2]) {
          informacion.periodo = periodoDeclaracionMatch[2].trim();
        }
        
        const ventasMatch = texto.match(/(VENTAS GRAVADAS|VENTAS)[:\s]*\$?\s*([\d.,]+)/i);
        if (ventasMatch && ventasMatch[2]) {
          informacion.ventas_gravadas = parseFloat(ventasMatch[2].replace(/[^\d.]/g, ''));
        }
        
        const ivaDebitoMatch = texto.match(/(IVA DEBITO FISCAL|IVA DÉBITO)[:\s]*\$?\s*([\d.,]+)/i);
        if (ivaDebitoMatch && ivaDebitoMatch[2]) {
          informacion.iva_debito = parseFloat(ivaDebitoMatch[2].replace(/[^\d.]/g, ''));
        }
        break;
    }

    console.log(`. Información extraída para ${tipo}:`, informacion);
    return Object.keys(informacion).length > 0 ? informacion : null;
    
  } catch (error) {
    console.error('. Error en extracción de información:', error);
    return null;
  }
};

// FUNCIÓN MEJORADA PARA INICIAR VERIFICACIÓN CON DIDIT
const iniciarVerificacionDidit = async (solicitudId, documentoId, archivoBuffer) => {
  try {
    console.log(`. Iniciando verificación Didit para documento: ${documentoId}`);
    
    const resultado = await diditService.verifyIdentity(archivoBuffer);
    
    if (resultado.success) {
      console.log(`. Verificación Didit completada: ${resultado.data.id_verification?.status || 'Approved'}`);
      
      // 1. Actualizar estado del documento en la tabla documentos
      const estadoDocumento = (resultado.data.id_verification?.status === 'Approved' || resultado.data.status === 'Approved') ? 'validado' : 'rechazado';
      
      const { error: docError } = await supabase
        .from('documentos')
        .update({
          estado: estadoDocumento,
          comentarios: `Verificación Didit: ${resultado.data.id_verification?.status || resultado.data.status}`,
          validado_en: new Date().toISOString()
        })
        .eq('id', documentoId);

      if (docError) {
        console.error('. Error actualizando documento:', docError);
      }

      // 2. GUARDAR EN TABLA verificaciones_kyc (ESTO ES LO QUE FALTA)
      const sessionId = resultado.data.session_id || `didit_${Date.now()}_${documentoId}`;
      const estadoKYC = (resultado.data.id_verification?.status || resultado.data.status || 'approved').toLowerCase();
      
      const verificacionData = {
        solicitud_id: solicitudId,
        session_id: sessionId,
        proveedor: 'didit',
        estado: estadoKYC,
        datos_verificacion: resultado.data, // Guardar toda la respuesta de Didit
        created_at: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };

      const { data: kycData, error: kycError } = await supabase
        .from('verificaciones_kyc')
        .insert([verificacionData])
        .select();

      if (kycError) {
        console.error('. Error guardando en verificaciones_kyc:', kycError);
        
        // Intentar crear la tabla si no existe
        if (kycError.code === '42P01') {
          console.log('. Tabla verificaciones_kyc no existe, intentando crear...');
          // En un entorno real, aquí ejecutarías el SQL para crear la tabla
          console.log('. Ejecuta el SQL para crear la tabla verificaciones_kyc');
        }
      } else {
        console.log('. Verificación KYC guardada en tabla con ID:', kycData[0].id);
      }

    } else {
      console.warn('. Verificación Didit falló:', resultado.error);
      
      // Guardar el fallo en verificaciones_kyc también
      const verificacionData = {
        solicitud_id: solicitudId,
        session_id: `didit_failed_${Date.now()}`,
        proveedor: 'didit',
        estado: 'fallido',
        datos_verificacion: { error: resultado.error },
        created_at: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };

      await supabase
        .from('verificaciones_kyc')
        .insert([verificacionData]);
    }
  } catch (error) {
    console.error('. Error en verificación Didit:', error);
    
    // Guardar el error en verificaciones_kyc
    const verificacionData = {
      solicitud_id: solicitudId,
      session_id: `didit_error_${Date.now()}`,
      proveedor: 'didit',
      estado: 'error',
      datos_verificacion: { error: error.message },
      created_at: new Date().toISOString(),
      actualizado_en: new Date().toISOString()
    };

    await supabase
      .from('verificaciones_kyc')
      .insert([verificacionData]);
  }
};

// Obtener documentos de una solicitud
const obtenerDocumentosSolicitud = async (req, res) => {
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
};

// Validar documento manualmente (para operadores)
const validarDocumento = async (req, res) => {
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
};
const descargarDocumento = async (req, res) => {
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

    // Verificar permisos (solo el solicitante dueño o operadores)
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

    // Obtener el archivo de Supabase Storage
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

    // Convertir a buffer
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
};
module.exports = {
  subirDocumento,
  obtenerDocumentosSolicitud,
  validarDocumento,
  descargarDocumento
};