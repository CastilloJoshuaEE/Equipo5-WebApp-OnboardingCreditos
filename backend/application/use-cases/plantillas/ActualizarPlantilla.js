// backend/application/use-cases/plantillas/ActualizarPlantilla.js
const AuditoriaPlantilla = require('../../../domain/entities/AuditoriaPlantilla');

class ActualizarPlantilla {
  constructor(plantillaDocumentoRepository) {
    this.plantillaDocumentoRepository = plantillaDocumentoRepository;
  }

  async execute(id, archivo, usuario, req) {
    if (!archivo) {
      return {
        success: false,
        status: 400,
        message: 'No se envió archivo'
      };
    }

    console.log('Actualizando plantilla ID:', id);

    // Obtener plantilla existente
    const plantilla = await this.plantillaDocumentoRepository.obtenerPorId(id);
    if (!plantilla) {
      return {
        success: false,
        status: 404,
        message: 'Plantilla no encontrada'
      };
    }

    const rutaStorage = plantilla.ruta_storage;

    // Subir nuevo archivo al storage
    await this.plantillaDocumentoRepository.subirArchivoStorage(
      rutaStorage,
      archivo.buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    // Actualizar registro en BD
    const plantillaActualizada = await this.plantillaDocumentoRepository.actualizar(id, {
      tamanio_bytes: archivo.size
    });

    // Registrar auditoría
    const auditoria = new AuditoriaPlantilla({
      plantilla_id: id,
      usuario_id: usuario.id,
      accion: AuditoriaPlantilla.ACCIONES.ACTUALIZAR_PLANTILLA,
      descripcion: `Plantilla actualizada: ${plantilla.nombre_archivo}`,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    await this.plantillaDocumentoRepository.registrarAuditoria(auditoria.toJSON());

    console.log('Plantilla actualizada exitosamente');

    return {
      success: true,
      message: 'Plantilla actualizada exitosamente',
      data: plantillaActualizada
    };
  }
}

module.exports = ActualizarPlantilla;