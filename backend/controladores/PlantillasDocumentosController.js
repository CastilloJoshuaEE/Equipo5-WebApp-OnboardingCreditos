// controladores/PlantillasDocumentoController.js
const PlantillasDocumentosModel = require('../modelos/PlantillasDocumentosModel');

class PlantillasDocumentoController {
  
  // Listar plantillas disponibles
  static async listarPlantillas(req, res) {
    try {
      const plantillas = await PlantillasDocumentosModel.listarPlantillas();

      res.json({ 
        success: true, 
        data: plantillas 
      });
    } catch (error) {
      console.error('. Error obteniendo plantillas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener plantillas',
      });
    }
  }

  // Obtener plantilla por ID
  static async obtenerPlantilla(req, res) {
    try {
      const { id } = req.params;

      const plantilla = await PlantillasDocumentosModel.obtenerPorId(id);

      if (!plantilla) {
        return res.status(404).json({
          success: false,
          message: 'Plantilla no encontrada',
        });
      }

      res.json({ 
        success: true, 
        data: plantilla 
      });
    } catch (error) {
      console.error('. Error obteniendo plantilla:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener plantilla',
      });
    }
  }

  // Descargar plantilla específica
  static async descargarPlantilla(req, res) {
    try {
      const { id } = req.params;

      const plantilla = await PlantillasDocumentosModel.obtenerPorId(id);

      if (!plantilla) {
        return res.status(404).json({
          success: false,
          message: 'Plantilla no encontrada',
        });
      }

      const fileData = await PlantillasDocumentosModel.descargarArchivo(plantilla.ruta_storage);
      const buffer = Buffer.from(await fileData.arrayBuffer());

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${plantilla.nombre_archivo}"`);
      res.send(buffer);
    } catch (error) {
      console.error('. Error en descargarPlantilla:', error);
      res.status(500).json({
        success: false,
        message: 'Error al descargar la plantilla',
      });
    }
  }

  // Subir nueva plantilla
  static async subirPlantilla(req, res) {
    try {
      const archivo = req.file;
      const { tipo } = req.body;

      if (!archivo) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se envió archivo' 
        });
      }

      const nombreArchivo = archivo.originalname;
      const rutaStorage = PlantillasDocumentosModel.generarRutaStorage(nombreArchivo, tipo);

      console.log('. Subiendo plantilla:', { nombreArchivo, rutaStorage, tipo });

      // Validar datos
      PlantillasDocumentosModel.validarDatosPlantilla({
        nombre_archivo: nombreArchivo,
        ruta_storage: rutaStorage,
        tipo: tipo || 'contrato',
        tamanio_bytes: archivo.size
      });

      // Verificar si ya existe plantilla con mismo nombre
      const nombreExiste = await PlantillasDocumentosModel.verificarNombreExistente(nombreArchivo);
      if (nombreExiste) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una plantilla con el mismo nombre'
        });
      }

      // 1. Subir archivo al storage
      await PlantillasDocumentosModel.subirArchivoStorage(rutaStorage, archivo.buffer);

      console.log('. Archivo subido exitosamente a storage');

      // 2. Insertar registro en BD
      const plantillaData = {
        tipo: tipo || 'contrato',
        nombre_archivo: nombreArchivo,
        ruta_storage: rutaStorage,
        tamanio_bytes: archivo.size,
        activa: false // Por defecto no activa
      };

      const plantilla = await PlantillasDocumentosModel.crear(plantillaData);

      // 3. Registrar auditoría
      await PlantillasDocumentosModel.registrarAuditoria({
        plantilla_id: plantilla.id,
        usuario_id: req.usuario.id,
        accion: 'subir_plantilla',
        descripcion: `Nueva plantilla subida: ${nombreArchivo}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      console.log('. Plantilla registrada exitosamente en BD');

      res.json({ 
        success: true, 
        message: 'Plantilla subida exitosamente',
        data: plantilla 
      });
    } catch (error) {
      console.error('. Error subiendo plantilla:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al subir plantilla: ' + error.message 
      });
    }
  }

  // Actualizar plantilla existente
  static async actualizarPlantilla(req, res) {
    try {
      const { id } = req.params;
      const archivo = req.file;

      if (!archivo) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se envió archivo' 
        });
      }

      console.log('. Actualizando plantilla ID:', id);

      // 1. Obtener plantilla existente
      const plantilla = await PlantillasDocumentosModel.obtenerPorId(id);
      if (!plantilla) {
        return res.status(404).json({ 
          success: false, 
          message: 'Plantilla no encontrada' 
        });
      }

      const rutaStorage = plantilla.ruta_storage;

      // 2. Subir nuevo archivo al storage
      await PlantillasDocumentosModel.subirArchivoStorage(rutaStorage, archivo.buffer);

      // 3. Actualizar registro en BD
      const plantillaActualizada = await PlantillasDocumentosModel.actualizar(id, { 
        tamanio_bytes: archivo.size 
      });

      // 4. Registrar auditoría
      await PlantillasDocumentosModel.registrarAuditoria({
        plantilla_id: id,
        usuario_id: req.usuario.id,
        accion: 'actualizar_plantilla',
        descripcion: `Plantilla actualizada: ${plantilla.nombre_archivo}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      console.log('. Plantilla actualizada exitosamente');

      res.json({ 
        success: true, 
        message: 'Plantilla actualizada exitosamente',
        data: plantillaActualizada 
      });
    } catch (error) {
      console.error('. Error actualizando plantilla:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar plantilla: ' + error.message 
      });
    }
  }

  // Eliminar plantilla
  static async eliminarPlantilla(req, res) {
    try {
      const { id } = req.params;

      console.log('. Eliminando plantilla ID:', id);

      const resultado = await PlantillasDocumentosModel.eliminar(id);

      // Registrar auditoría
      await PlantillasDocumentosModel.registrarAuditoria({
        plantilla_id: id,
        usuario_id: req.usuario.id,
        accion: 'eliminar_plantilla',
        descripcion: 'Plantilla eliminada del sistema',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({ 
        success: true, 
        message: 'Plantilla eliminada exitosamente',
        data: resultado 
      });
    } catch (error) {
      console.error('. Error eliminando plantilla:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al eliminar plantilla: ' + error.message 
      });
    }
  }

  // Marcar plantilla como activa
  static async activarPlantilla(req, res) {
    try {
      const { id } = req.params;

      console.log('. Activando plantilla ID:', id);

      const plantilla = await PlantillasDocumentosModel.obtenerPorId(id);
      if (!plantilla) {
        return res.status(404).json({ 
          success: false, 
          message: 'Plantilla no encontrada' 
        });
      }

      const plantillaActivada = await PlantillasDocumentosModel.marcarComoActiva(id, plantilla.tipo);

      // Registrar auditoría
      await PlantillasDocumentosModel.registrarAuditoria({
        plantilla_id: id,
        usuario_id: req.usuario.id,
        accion: 'activar_plantilla',
        descripcion: `Plantilla marcada como activa para tipo: ${plantilla.tipo}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({ 
        success: true, 
        message: 'Plantilla activada exitosamente',
        data: plantillaActivada 
      });
    } catch (error) {
      console.error('. Error activando plantilla:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al activar plantilla: ' + error.message 
      });
    }
  }

  // Obtener estadísticas de plantillas
  static async obtenerEstadisticas(req, res) {
    try {
      const estadisticas = await PlantillasDocumentosModel.obtenerEstadisticas();

      res.json({ 
        success: true, 
        data: estadisticas 
      });
    } catch (error) {
      console.error('. Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener estadísticas' 
      });
    }
  }

  // Buscar plantillas
  static async buscarPlantillas(req, res) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ 
          success: false, 
          message: 'Término de búsqueda requerido' 
        });
      }

      const resultados = await PlantillasDocumentosModel.buscar(q);

      res.json({ 
        success: true, 
        data: resultados 
      });
    } catch (error) {
      console.error('. Error buscando plantillas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al buscar plantillas' 
      });
    }
  }
}

module.exports = PlantillasDocumentoController;