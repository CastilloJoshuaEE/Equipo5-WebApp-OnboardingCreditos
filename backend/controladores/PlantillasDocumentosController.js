const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');

class PlantillasDocumentoController {
  // Listar plantillas disponibles
  static async listarPlantillas(req, res) {
    try {
      const { data, error } = await supabase
        .from('plantilla_documentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      console.error('. Error obteniendo plantillas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener plantillas',
      });
    }
  }

  // Descargar plantilla específica
  static async descargarPlantilla(req, res) {
    try {
      const { id } = req.params;

      const { data: plantilla, error } = await supabase
        .from('plantilla_documentos')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !plantilla) {
        return res.status(404).json({
          success: false,
          message: 'Plantilla no encontrada',
        });
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('kyc-documents')
        .download(plantilla.ruta_storage);

      if (downloadError) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado en storage',
        });
      }

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
      return res.status(400).json({ success: false, message: 'No se envió archivo' });
    }

    const nombreArchivo = archivo.originalname;
    const rutaStorage = `plantilla/${nombreArchivo}`;

    // Subir al bucket
    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(rutaStorage, archivo.buffer, {
        upsert: true,
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    if (uploadError) throw uploadError;

    // Insertar registro en BD
const { data, error: insertError } = await supabaseAdmin
      .from('plantilla_documentos')
      .insert([
        {
          tipo,
          nombre_archivo: nombreArchivo,
          ruta_storage: rutaStorage,
          tamanio_bytes: archivo.size,
        },
      ])
      .select('*')
      .single();

    if (insertError) throw insertError;

    res.json({ success: true, data });
  } catch (error) {
    console.error('. Error subiendo plantilla:', error);
    res.status(500).json({ success: false, message: 'Error al subir plantilla' });
  }
}

// Actualizar plantilla existente
static async actualizarPlantilla(req, res) {
  try {
    const { id } = req.params;
    const archivo = req.file;

    const { data: plantilla } = await supabase
      .from('plantilla_documentos')
      .select('*')
      .eq('id', id)
      .single();

    if (!plantilla) {
      return res.status(404).json({ success: false, message: 'Plantilla no encontrada' });
    }

    const rutaStorage = plantilla.ruta_storage;
    const { error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(rutaStorage, archivo.buffer, {
        upsert: true,
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from('plantilla_documentos')
      .update({ tamanio_bytes: archivo.size, updated_at: new Date() })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Plantilla actualizada exitosamente' });
  } catch (error) {
    console.error('. Error actualizando plantilla:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar plantilla' });
  }
}

}

module.exports = PlantillasDocumentoController;
