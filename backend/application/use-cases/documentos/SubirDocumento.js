// backend/application/use-cases/documentos/SubirDocumento.js
const Documento = require('../../../domain/entities/Documento');

class SubirDocumento {
  constructor(documentoRepository, diditService) {
    this.documentoRepository = documentoRepository;
    this.diditService = diditService;
  }

  async execute(solicitud_id, tipo, archivo) {
    if (!solicitud_id || !tipo || !archivo) {
      return {
        success: false,
        status: 400,
        message: 'Solicitud ID, tipo y archivo son requeridos'
      };
    }

    const documentoEntity = new Documento({
      solicitud_id,
      tipo,
      nombre_archivo: archivo.originalname,
      tamanio_bytes: archivo.size,
      estado: 'pendiente'
    });

    try {
      documentoEntity.validarTipo();
    } catch (error) {
      return {
        success: false,
        status: 400,
        message: error.message
      };
    }

    const extension = archivo.originalname.toLowerCase().split('.').pop();
    const nombreArchivo = `${solicitud_id}_${tipo}_${Date.now()}.${extension}`;
    const rutaStorage = `documentos/${solicitud_id}/${nombreArchivo}`;

    await this.documentoRepository.subirArchivoStorage(rutaStorage, archivo.buffer, archivo.mimetype);

    const urlPublica = await this.documentoRepository.obtenerUrlPublica(rutaStorage);

    let informacionExtraida = null;
    if (archivo.originalname.toLowerCase().endsWith('.pdf')) {
      informacionExtraida = await this.extraerInformacionDocumento(urlPublica, tipo, archivo.buffer);
    }

    documentoEntity.ruta_storage = rutaStorage;
    documentoEntity.informacion_extraida = informacionExtraida;

    // Asegurar que el objeto a guardar no tenga ID (se generará en el repositorio)
    const documentoData = {
      solicitud_id: documentoEntity.solicitud_id,
      tipo: documentoEntity.tipo,
      nombre_archivo: documentoEntity.nombre_archivo,
      ruta_storage: documentoEntity.ruta_storage,
      tamanio_bytes: documentoEntity.tamanio_bytes,
      estado: documentoEntity.estado,
      informacion_extraida: documentoEntity.informacion_extraida
    };

    // Usar el método create (no crear)
    const documento = await this.documentoRepository.create(documentoData);

    if (tipo === 'dni') {
      await this.iniciarVerificacionDidit(solicitud_id, documento.id, archivo.buffer);
    }

    return {
      success: true,
      status: 201,
      message: 'Documento subido exitosamente',
      data: {
        documento,
        url_publica: urlPublica,
        informacion_extraida: informacionExtraida
      }
    };
  }

  async extraerInformacionDocumento(pdfUrl, tipo, buffer) {
    return null;
  }

  async iniciarVerificacionDidit(solicitudId, documentoId, archivoBuffer) {
    try {
      const resultado = await this.diditService.verifyIdentity(archivoBuffer);

      if (resultado.success) {
        const estadoDocumento = (resultado.data.id_verification?.status === 'Approved') ? 'validado' : 'rechazado';

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

        await this.documentoRepository.actualizar(documentoId, {
          estado: estadoDocumento,
          comentarios: `Verificación Didit: ${resultado.data.id_verification?.status}`,
          validado_en: new Date().toISOString(),
          ...(informacionExtraida && { informacion_extraida: informacionExtraida })
        });
      }
    } catch (error) {
      console.error('Error en verificación Didit:', error);
    }
  }
}

module.exports = SubirDocumento;