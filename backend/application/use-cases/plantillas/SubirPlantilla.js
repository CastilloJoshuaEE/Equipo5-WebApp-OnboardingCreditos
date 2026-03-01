// backend/application/use-cases/plantillas/SubirPlantilla.js
const PlantillaDocumento = require('../../../domain/entities/PlantillaDocumento');
const AuditoriaPlantilla = require('../../../domain/entities/AuditoriaPlantilla');

class SubirPlantilla {
  constructor(plantillaDocumentoRepository) {
    this.plantillaDocumentoRepository = plantillaDocumentoRepository;
  }

  async execute(archivo, tipo, usuario, req) {
    if (!archivo) {
      return {
        success: false,
        status: 400,
        message: 'No se envió archivo'
      };
    }

    const nombreArchivo = archivo.originalname;
    const rutaStorage = this.generarRutaStorage(nombreArchivo, tipo);

    // Validar datos
    try {
      PlantillaDocumento.prototype.validar.call({
        nombre_archivo: nombreArchivo,
        ruta_storage: rutaStorage,
        tipo: tipo || 'contrato',
        tamanio_bytes: archivo.size
      });
    } catch (error) {
      return {
        success: false,
        status: 400,
        message: error.message
      };
    }

    // Verificar si ya existe plantilla con mismo nombre
    const nombreExiste = await this.plantillaDocumentoRepository.verificarNombreExistente(nombreArchivo);
    if (nombreExiste) {
      return {
        success: false,
        status: 400,
        message: 'Ya existe una plantilla con el mismo nombre'
      };
    }

    // Subir archivo al storage
    await this.plantillaDocumentoRepository.subirArchivoStorage(
      rutaStorage,
      archivo.buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    // Insertar registro en BD
    const plantillaEntity = new PlantillaDocumento({
      tipo: tipo || 'contrato',
      nombre_archivo: nombreArchivo,
      ruta_storage: rutaStorage,
      tamanio_bytes: archivo.size,
      activa: false
    });

    const plantilla = await this.plantillaDocumentoRepository.crear(plantillaEntity.toJSON());

    // Registrar auditoría
    const auditoria = new AuditoriaPlantilla({
      plantilla_id: plantilla.id,
      usuario_id: usuario.id,
      accion: AuditoriaPlantilla.ACCIONES.SUBIR_PLANTILLA,
      descripcion: `Nueva plantilla subida: ${nombreArchivo}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await this.plantillaDocumentoRepository.registrarAuditoria(auditoria.toJSON());
    return {
      success: true,
      message: 'Plantilla subida exitosamente',
      data: plantilla
    };
  }

  generarRutaStorage(nombreArchivo, tipo = 'contrato') {
    const timestamp = Date.now();
    const nombreSinExtension = nombreArchivo.replace('.docx', '');
    return `plantilla/${tipo}-${nombreSinExtension}-${timestamp}.docx`;
  }
}

module.exports = SubirPlantilla;