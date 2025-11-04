// modelos/PlantillasDocumentosModel.js
const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');

class PlantillasDocumentosModel {
    
    /**
     * Listar todas las plantillas disponibles
     */
    static async listarPlantillas() {
        try {
            const { data: plantillas, error } = await supabase
                .from('plantilla_documentos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return plantillas || [];

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.listarPlantillas:', error);
            throw error;
        }
    }

    /**
     * Obtener plantilla por ID
     */
    static async obtenerPorId(id) {
        try {
            const { data: plantilla, error } = await supabase
                .from('plantilla_documentos')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return plantilla;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.obtenerPorId:', error);
            throw error;
        }
    }

    /**
     * Obtener plantilla por tipo
     */
    static async obtenerPorTipo(tipo) {
        try {
            const { data: plantillas, error } = await supabase
                .from('plantilla_documentos')
                .select('*')
                .eq('tipo', tipo)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return plantillas || [];

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.obtenerPorTipo:', error);
            throw error;
        }
    }

    /**
     * Obtener la plantilla activa por tipo
     */
    static async obtenerActivaPorTipo(tipo) {
        try {
            const { data: plantilla, error } = await supabase
                .from('plantilla_documentos')
                .select('*')
                .eq('tipo', tipo)
                .eq('activa', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return plantilla;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.obtenerActivaPorTipo:', error);
            throw error;
        }
    }

    /**
     * Crear nueva plantilla (usando supabaseAdmin para evitar RLS)
     */
    static async crear(plantillaData) {
        try {
            const { data: plantilla, error } = await supabaseAdmin
                .from('plantilla_documentos')
                .insert([{
                    ...plantillaData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return plantilla;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.crear:', error);
            throw error;
        }
    }

    /**
     * Actualizar plantilla existente (usando supabaseAdmin para evitar RLS)
     */
    static async actualizar(id, updateData) {
        try {
            const { data: plantilla, error } = await supabaseAdmin
                .from('plantilla_documentos')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return plantilla;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.actualizar:', error);
            throw error;
        }
    }

    /**
     * Eliminar plantilla
     */
    static async eliminar(id) {
        try {
            // Primero obtener la plantilla para saber la ruta del archivo
            const plantilla = await this.obtenerPorId(id);
            if (!plantilla) {
                throw new Error('Plantilla no encontrada');
            }

            // Eliminar el archivo del storage
            const { error: storageError } = await supabaseAdmin.storage
                .from('kyc-documents')
                .remove([plantilla.ruta_storage]);

            if (storageError) {
                console.error('. Error eliminando archivo de storage:', storageError);
                // Continuar aunque falle la eliminación del archivo
            }

            // Eliminar el registro de la base de datos
            const { error: deleteError } = await supabaseAdmin
                .from('plantilla_documentos')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            return { 
                success: true, 
                message: 'Plantilla eliminada exitosamente',
                plantilla_eliminada: plantilla 
            };

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.eliminar:', error);
            throw error;
        }
    }

    /**
     * Subir archivo al storage (usando supabaseAdmin)
     */
    static async subirArchivoStorage(rutaStorage, buffer, contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
            const { data, error } = await supabaseAdmin.storage
                .from('kyc-documents')
                .upload(rutaStorage, buffer, {
                    upsert: true,
                    contentType: contentType,
                });

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.subirArchivoStorage:', error);
            throw error;
        }
    }

    /**
     * Eliminar archivo del storage (usando supabaseAdmin)
     */
    static async eliminarArchivoStorage(rutaStorage) {
        try {
            const { data, error } = await supabaseAdmin.storage
                .from('kyc-documents')
                .remove([rutaStorage]);

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.eliminarArchivoStorage:', error);
            throw error;
        }
    }

    /**
     * Descargar archivo del storage
     */
    static async descargarArchivo(rutaStorage) {
        try {
            const { data: fileData, error } = await supabase.storage
                .from('kyc-documents')
                .download(rutaStorage);

            if (error) throw error;
            return fileData;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.descargarArchivo:', error);
            throw error;
        }
    }

    /**
     * Verificar si existe archivo en storage
     */
    static async verificarArchivoExiste(rutaStorage) {
        try {
            const { data, error } = await supabase.storage
                .from('kyc-documents')
                .list('plantilla', {
                    search: rutaStorage.replace('plantilla/', '')
                });

            if (error) throw error;
            return data && data.length > 0;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.verificarArchivoExiste:', error);
            return false;
        }
    }

    /**
     * Marcar plantilla como activa/desactivar otras del mismo tipo
     */
    static async marcarComoActiva(id, tipo) {
        try {
            // Iniciar transacción: desactivar todas las plantillas del mismo tipo
            const { error: desactivarError } = await supabaseAdmin
                .from('plantilla_documentos')
                .update({ 
                    activa: false,
                    updated_at: new Date().toISOString()
                })
                .eq('tipo', tipo)
                .eq('activa', true);

            if (desactivarError) throw desactivarError;

            // Activar la plantilla específica
            const plantillaActivada = await this.actualizar(id, { activa: true });

            return plantillaActivada;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.marcarComoActiva:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de plantillas
     */
    static async obtenerEstadisticas() {
        try {
            // Contar total de plantillas
            const { count: total, error: totalError } = await supabase
                .from('plantilla_documentos')
                .select('*', { count: 'exact', head: true });

            if (totalError) throw totalError;

            // Contar por tipo
            const { data: porTipo, error: tipoError } = await supabase
                .from('plantilla_documentos')
                .select('tipo')
                .eq('activa', true);

            if (tipoError) throw tipoError;

            const tipos = {};
            if (porTipo) {
                porTipo.forEach(item => {
                    tipos[item.tipo] = (tipos[item.tipo] || 0) + 1;
                });
            }

            // Obtener tamaño total de almacenamiento
            const { data: todasPlantillas, error: plantillasError } = await supabase
                .from('plantilla_documentos')
                .select('tamanio_bytes');

            if (plantillasError) throw plantillasError;

            const tamanioTotal = todasPlantillas?.reduce((sum, plantilla) => 
                sum + (plantilla.tamanio_bytes || 0), 0) || 0;

            return {
                total: total || 0,
                por_tipo: tipos,
                tamanio_total_bytes: tamanioTotal,
                tamanio_total_mb: (tamanioTotal / (1024 * 1024)).toFixed(2)
            };

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.obtenerEstadisticas:', error);
            throw error;
        }
    }

    /**
     * Validar datos de plantilla antes de crear/actualizar
     */
    static validarDatosPlantilla(plantillaData) {
        const errores = [];

        if (!plantillaData.nombre_archivo) {
            errores.push('El nombre del archivo es requerido');
        }

        if (!plantillaData.ruta_storage) {
            errores.push('La ruta de storage es requerida');
        }

        if (!plantillaData.tipo) {
            errores.push('El tipo de plantilla es requerido');
        }

        if (plantillaData.tamanio_bytes && plantillaData.tamanio_bytes <= 0) {
            errores.push('El tamaño del archivo debe ser mayor a 0');
        }

        // Validar extensión del archivo
        if (plantillaData.nombre_archivo && !plantillaData.nombre_archivo.toLowerCase().endsWith('.docx')) {
            errores.push('El archivo debe ser un documento Word (.docx)');
        }

        if (errores.length > 0) {
            throw new Error(`Datos de plantilla inválidos: ${errores.join(', ')}`);
        }

        return true;
    }

    /**
     * Generar ruta de storage única
     */
    static generarRutaStorage(nombreArchivo, tipo = 'contrato') {
        const timestamp = Date.now();
        const nombreSinExtension = nombreArchivo.replace('.docx', '');
        return `plantilla/${tipo}-${nombreSinExtension}-${timestamp}.docx`;
    }

    /**
     * Obtener historial de cambios de una plantilla
     */
    static async obtenerHistorial(id) {
        try {
            const { data: historial, error } = await supabase
                .from('auditoria_plantillas')
                .select(`
                    *,
                    usuarios: usuario_id(
                        nombre_completo,
                        email
                    )
                `)
                .eq('plantilla_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return historial || [];

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.obtenerHistorial:', error);
            throw error;
        }
    }

    /**
     * Registrar evento en auditoría
     */
    static async registrarAuditoria(auditoriaData) {
        try {
            const { data: auditoria, error } = await supabaseAdmin
                .from('auditoria_plantillas')
                .insert([{
                    ...auditoriaData,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            return auditoria;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.registrarAuditoria:', error);
            throw error;
        }
    }

    /**
     * Buscar plantillas por nombre o tipo
     */
    static async buscar(busqueda) {
        try {
            const { data: plantillas, error } = await supabase
                .from('plantilla_documentos')
                .select('*')
                .or(`nombre_archivo.ilike.%${busqueda}%,tipo.ilike.%${busqueda}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return plantillas || [];

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.buscar:', error);
            throw error;
        }
    }

    /**
     * Verificar si ya existe plantilla con mismo nombre
     */
    static async verificarNombreExistente(nombreArchivo, excluirId = null) {
        try {
            let query = supabase
                .from('plantilla_documentos')
                .select('id')
                .eq('nombre_archivo', nombreArchivo);

            if (excluirId) {
                query = query.neq('id', excluirId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data && data.length > 0;

        } catch (error) {
            console.error('. Error en PlantillasDocumentosModel.verificarNombreExistente:', error);
            throw error;
        }
    }
}

module.exports = PlantillasDocumentosModel;