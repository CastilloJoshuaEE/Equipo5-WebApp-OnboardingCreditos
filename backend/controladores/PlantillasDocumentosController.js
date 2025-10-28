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

  // Subir nueva plantilla - USANDO SUPABASE ADMIN PARA EVITAR RLS
  static async subirPlantilla(req, res) {
    try {
      const archivo = req.file;
      const { tipo } = req.body;

      if (!archivo) {
        return res.status(400).json({ success: false, message: 'No se envió archivo' });
      }

      const nombreArchivo = archivo.originalname;
      const rutaStorage = `plantilla/${nombreArchivo}`;

      console.log('. Subiendo plantilla:', { nombreArchivo, rutaStorage, tipo });

      // 1. Subir archivo al storage usando el cliente admin
      const { error: uploadError } = await supabaseAdmin.storage
        .from('kyc-documents')
        .upload(rutaStorage, archivo.buffer, {
          upsert: true,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

      if (uploadError) {
        console.error('. Error subiendo archivo a storage:', uploadError);
        throw uploadError;
      }

      console.log('. Archivo subido exitosamente a storage');

      // 2. Insertar registro en BD usando el cliente admin para evitar RLS
      const { data, error: insertError } = await supabaseAdmin
        .from('plantilla_documentos')
        .insert([
          {
            tipo: tipo || 'contrato',
            nombre_archivo: nombreArchivo,
            ruta_storage: rutaStorage,
            tamanio_bytes: archivo.size,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
        ])
        .select('*')
        .single();

      if (insertError) {
        console.error('. Error insertando en BD:', insertError);
        
        // Si falla la inserción, eliminar el archivo del storage
        await supabaseAdmin.storage
          .from('kyc-documents')
          .remove([rutaStorage]);
          
        throw insertError;
      }

      console.log('. Plantilla registrada exitosamente en BD');

      res.json({ 
        success: true, 
        message: 'Plantilla subida exitosamente',
        data 
      });
    } catch (error) {
      console.error('. Error subiendo plantilla:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al subir plantilla: ' + error.message 
      });
    }
  }

  // Actualizar plantilla existente - USANDO SUPABASE ADMIN
  static async actualizarPlantilla(req, res) {
    try {
      const { id } = req.params;
      const archivo = req.file;

      if (!archivo) {
        return res.status(400).json({ success: false, message: 'No se envió archivo' });
      }

      console.log('. Actualizando plantilla ID:', id);

      // 1. Obtener plantilla existente usando cliente normal
      const { data: plantilla, error: fetchError } = await supabase
        .from('plantilla_documentos')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !plantilla) {
        return res.status(404).json({ 
          success: false, 
          message: 'Plantilla no encontrada' 
        });
      }

      const rutaStorage = plantilla.ruta_storage;

      // 2. Subir nuevo archivo al storage usando admin
      const { error: uploadError } = await supabaseAdmin.storage
        .from('kyc-documents')
        .upload(rutaStorage, archivo.buffer, {
          upsert: true,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

      if (uploadError) {
        console.error('. Error actualizando archivo en storage:', uploadError);
        throw uploadError;
      }

      // 3. Actualizar registro en BD usando admin
      const { error: updateError } = await supabaseAdmin
        .from('plantilla_documentos')
        .update({ 
          tamanio_bytes: archivo.size, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (updateError) {
        console.error('. Error actualizando registro en BD:', updateError);
        throw updateError;
      }

      console.log('. Plantilla actualizada exitosamente');

      res.json({ 
        success: true, 
        message: 'Plantilla actualizada exitosamente' 
      });
    } catch (error) {
      console.error('. Error actualizando plantilla:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar plantilla: ' + error.message 
      });
    }
  }
}

module.exports = PlantillasDocumentoController;