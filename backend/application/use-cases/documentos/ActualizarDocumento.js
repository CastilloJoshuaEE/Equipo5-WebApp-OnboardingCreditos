// backend/application/use-cases/documentos/ActualizarDocumento.js
const Documento = require('../../../domain/entities/Documento');

class ActualizarDocumento {
  constructor(documentoRepository, diditService) {
    this.documentoRepository = documentoRepository;
    this.diditService = diditService;
  }

  async execute(documento_id, tipo, archivo, usuario) {
    console.log('. Actualizando documento:', { documento_id, tipo, archivo: archivo ? archivo.originalname : 'NO ARCHIVO' });

    if (!documento_id || !tipo || !archivo) {
      return {
        success: false,
        status: 400,
        message: 'Documento ID, tipo y archivo son requeridos'
      };
    }

    // Obtener documento actual
    const documentoActual = await this.documentoRepository.obtenerPorId(documento_id);

    if (!documentoActual) {
      return {
        success: false,
        status: 404,
        message: 'Documento no encontrado'
      };
    }

    console.log(`. Actualizando documento ${tipo} con ID: ${documento_id}`);

    // Eliminar archivo anterior del storage
    try {
      await this.documentoRepository.eliminarArchivoStorage(documentoActual.ruta_storage);
      console.log('. Archivo anterior eliminado:', documentoActual.ruta_storage);
    } catch (storageError) {
      console.warn('. Error eliminando archivo anterior:', storageError.message);
    }

    // Generar nueva ruta de storage
    const rutaStorage = this.generarRutaStorage(documentoActual.solicitud_id, tipo, archivo.originalname);

    // Subir nuevo archivo
    await this.documentoRepository.subirArchivoStorage(rutaStorage, archivo.buffer, archivo.mimetype);

    // Obtener URL pública
    const urlPublica = await this.documentoRepository.obtenerUrlPublica(rutaStorage);

    // Extraer información del nuevo documento
    let informacionExtraida = null;
    if (archivo.originalname.toLowerCase().endsWith('.pdf')) {
      informacionExtraida = await this.extraerInformacionDocumento(urlPublica, tipo, archivo.buffer);
    }

    // Actualizar documento
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

    const documento = await this.documentoRepository.actualizar(documento_id, documentoData);

    console.log(`. Documento ${tipo} actualizado en BD con ID:`, documento.id);

    // Si es DNI, iniciar nueva verificación
    if (tipo === 'dni') {
      await this.iniciarVerificacionDidit(documentoActual.solicitud_id, documento.id, archivo.buffer);
    }

    return {
      success: true,
      message: 'Documento actualizado exitosamente',
      data: {
        documento,
        url_publica: urlPublica,
        informacion_extraida: informacionExtraida
      }
    };
  }

  generarRutaStorage(solicitudId, tipo, nombreArchivo) {
    const extension = nombreArchivo.toLowerCase().split('.').pop();
    const nombreUnico = `${solicitudId}_${tipo}_${Date.now()}.${extension}`;
    return `documentos/${solicitudId}/${nombreUnico}`;
  }

  async extraerInformacionDocumento(pdfUrl, tipo, buffer) {
    return null;
  }

  async iniciarVerificacionDidit(solicitudId, documentoId, archivoBuffer) {
    // Similar al método en SubirDocumento
  }
}

module.exports = ActualizarDocumento;