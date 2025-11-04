// modelos/DocumentoModel.js
const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');

class DocumentoModel {
        //Obtener documentos por solicitud
    static async findBySolicitudId(solicitudId){
        const{data, error}= await supabase
        .from('documentos')
        .select('*')
        .eq('solicitud_id', solicitudId)
        .order('created_at', {ascending: false});
        if(error) throw new Error(`Error obteniendo documentos: ${error.message}`);
        return data;
    }
    /**
     * Crear documento
     */
    static async crear(documentoData) {
        try {
            const { data: documento, error } = await supabase
                .from('documentos')
                .insert([documentoData])
                .select()
                .single();

            if (error) throw error;
            return documento;

        } catch (error) {
            console.error('. Error en DocumentoModel.crear:', error);
            throw error;
        }
    }

    /**
     * Obtener documento por ID
     */
    static async obtenerPorId(id) {
        try {
            const { data: documento, error } = await supabase
                .from('documentos')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return documento;

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerPorId:', error);
            throw error;
        }
    }

    /**
     * Obtener documentos por solicitud
     */
    static async obtenerPorSolicitud(solicitudId) {
        try {
            const { data: documentos, error } = await supabase
                .from('documentos')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return documentos || [];

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerPorSolicitud:', error);
            throw error;
        }
    }

    /**
     * Obtener documentos por tipo y solicitud
     */
    static async obtenerPorTipoYSolicitud(solicitudId, tipo) {
        try {
            const { data: documentos, error } = await supabase
                .from('documentos')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .eq('tipo', tipo)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return documentos || [];

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerPorTipoYSolicitud:', error);
            throw error;
        }
    }

    /**
     * Actualizar documento
     */
    static async actualizar(id, updates) {
        try {
            const { data: documento, error } = await supabase
                .from('documentos')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return documento;

        } catch (error) {
            console.error('. Error en DocumentoModel.actualizar:', error);
            throw error;
        }
    }

    /**
     * Eliminar documento
     */
    static async eliminar(id) {
        try {
            const { error } = await supabase
                .from('documentos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true, message: 'Documento eliminado exitosamente' };

        } catch (error) {
            console.error('. Error en DocumentoModel.eliminar:', error);
            throw error;
        }
    }

    /**
     * Contar documentos por tipo y estado
     */
    static async contarPorTipoYEstado(solicitudId, tipo, estado) {
        try {
            const { count, error } = await supabase
                .from('documentos')
                .select('*', { count: 'exact', head: true })
                .eq('solicitud_id', solicitudId)
                .eq('tipo', tipo)
                .eq('estado', estado);

            if (error) throw error;
            return count || 0;

        } catch (error) {
            console.error('. Error en DocumentoModel.contarPorTipoYEstado:', error);
            throw error;
        }
    }

    /**
     * Verificar documentos obligatorios completos
     */
    static async verificarDocumentosObligatorios(solicitudId) {
        try {
            const tiposObligatorios = ['dni', 'cuit', 'comprobante_domicilio'];
            
            const { data: documentos, error } = await supabase
                .from('documentos')
                .select('tipo, estado')
                .eq('solicitud_id', solicitudId)
                .in('tipo', tiposObligatorios);

            if (error) throw error;

            const tiposSubidos = documentos.map(doc => doc.tipo);
            const documentosFaltantes = tiposObligatorios.filter(tipo => !tiposSubidos.includes(tipo));
            
            // Verificar que los documentos subidos estén validados
            const documentosInvalidados = documentos.filter(doc => doc.estado !== 'validado');
            const todosValidados = documentosInvalidados.length === 0;

            return {
                completos: documentosFaltantes.length === 0,
                todos_validados: todosValidados,
                documentos_faltantes: documentosFaltantes,
                documentos_subidos: tiposSubidos,
                documentos_invalidados: documentosInvalidados.map(doc => doc.tipo)
            };

        } catch (error) {
            console.error('. Error en DocumentoModel.verificarDocumentosObligatorios:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de documentos por solicitud
     */
    static async obtenerEstadisticas(solicitudId) {
        try {
            const { data: documentos, error } = await supabase
                .from('documentos')
                .select('tipo, estado')
                .eq('solicitud_id', solicitudId);

            if (error) throw error;

            const estadisticas = {
                total: documentos?.length || 0,
                por_tipo: {},
                por_estado: {
                    pendiente: 0,
                    validado: 0,
                    rechazado: 0
                }
            };

            if (documentos) {
                documentos.forEach(doc => {
                    // Contar por tipo
                    if (!estadisticas.por_tipo[doc.tipo]) {
                        estadisticas.por_tipo[doc.tipo] = 0;
                    }
                    estadisticas.por_tipo[doc.tipo]++;

                    // Contar por estado
                    if (estadisticas.por_estado[doc.estado] !== undefined) {
                        estadisticas.por_estado[doc.estado]++;
                    }
                });
            }

            return estadisticas;

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerEstadisticas:', error);
            throw error;
        }
    }

    /**
     * Obtener documentos por estado
     */
    static async obtenerPorEstado(solicitudId, estado) {
        try {
            const { data: documentos, error } = await supabase
                .from('documentos')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .eq('estado', estado)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return documentos || [];

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerPorEstado:', error);
            throw error;
        }
    }

    /**
     * Validar tipos de documentos permitidos
     */
    static validarTipoDocumento(tipo) {
        const tiposPermitidos = [
            'dni', 
            'cuit', 
            'comprobante_domicilio', 
            'balance_contable', 
            'estado_financiero', 
            'declaracion_impuestos'
        ];

        if (!tiposPermitidos.includes(tipo)) {
            throw new Error(`Tipo de documento no válido. Permitidos: ${tiposPermitidos.join(', ')}`);
        }

        return true;
    }

    /**
     * Subir archivo al storage (usando supabaseAdmin para evitar RLS)
     */
    static async subirArchivoStorage(rutaStorage, buffer, contentType) {
        try {
            const { data, error } = await supabaseAdmin.storage
                .from('kyc-documents')
                .upload(rutaStorage, buffer, {
                    contentType: contentType,
                    upsert: false
                });

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('. Error en DocumentoModel.subirArchivoStorage:', error);
            throw error;
        }
    }

    /**
     * Eliminar archivo del storage
     */
    static async eliminarArchivoStorage(rutaStorage) {
        try {
            const { data, error } = await supabaseAdmin.storage
                .from('kyc-documents')
                .remove([rutaStorage]);

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('. Error en DocumentoModel.eliminarArchivoStorage:', error);
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
            console.error('. Error en DocumentoModel.descargarArchivo:', error);
            throw error;
        }
    }

    /**
     * Obtener URL pública de archivo
     */
    static async obtenerUrlPublica(rutaStorage) {
        try {
            const { data: urlData } = supabase.storage
                .from('kyc-documents')
                .getPublicUrl(rutaStorage);

            return urlData.publicUrl;

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerUrlPublica:', error);
            throw error;
        }
    }

    /**
     * Verificar si archivo existe en storage
     */
    static async verificarArchivoExiste(rutaStorage) {
        try {
            const { data, error } = await supabase.storage
                .from('kyc-documents')
                .list('', {
                    search: rutaStorage
                });

            if (error) throw error;
            return data && data.length > 0;

        } catch (error) {
            console.error('. Error en DocumentoModel.verificarArchivoExiste:', error);
            return false;
        }
    }

    /**
     * Generar ruta de storage única
     */
    static generarRutaStorage(solicitudId, tipo, nombreArchivo) {
        const extension = nombreArchivo.toLowerCase().split('.').pop();
        const nombreUnico = `${solicitudId}_${tipo}_${Date.now()}.${extension}`;
        return `documentos/${solicitudId}/${nombreUnico}`;
    }

    /**
     * Obtener documentos recientes (para dashboard)
     */
    static async obtenerRecientes(limite = 10) {
        try {
            const { data: documentos, error } = await supabase
                .from('documentos')
                .select(`
                    *,
                    solicitudes_credito (
                        numero_solicitud,
                        solicitantes: solicitante_id (
                            usuarios (
                                nombre_completo
                            )
                        )
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(limite);

            if (error) throw error;
            return documentos || [];

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerRecientes:', error);
            throw error;
        }
    }

    /**
     * Buscar documentos por criterios
     */
    static async buscar(criterios) {
        try {
            let query = supabase
                .from('documentos')
                .select(`
                    *,
                    solicitudes_credito (
                        numero_solicitud,
                        solicitantes: solicitante_id (
                            usuarios (
                                nombre_completo,
                                email
                            )
                        )
                    )
                `);

            if (criterios.tipo) {
                query = query.eq('tipo', criterios.tipo);
            }

            if (criterios.estado) {
                query = query.eq('estado', criterios.estado);
            }

            if (criterios.solicitud_id) {
                query = query.eq('solicitud_id', criterios.solicitud_id);
            }

            if (criterios.fecha_desde) {
                query = query.gte('created_at', criterios.fecha_desde);
            }

            if (criterios.fecha_hasta) {
                query = query.lte('created_at', criterios.fecha_hasta);
            }

            query = query.order('created_at', { ascending: false });

            const { data: documentos, error } = await query;

            if (error) throw error;
            return documentos || [];

        } catch (error) {
            console.error('. Error en DocumentoModel.buscar:', error);
            throw error;
        }
    }

    /**
     * Obtener documentos para evaluación
     */
    static async obtenerParaEvaluacion(operadorId = null) {
        try {
            let query = supabase
                .from('documentos')
                .select(`
                    *,
                    solicitudes_credito (
                        numero_solicitud,
                        estado,
                        solicitantes: solicitante_id (
                            usuarios (
                                nombre_completo,
                                email
                            )
                        ),
                        operadores: operador_id (
                            usuarios (
                                nombre_completo
                            )
                        )
                    )
                `)
                .eq('estado', 'pendiente')
                .order('created_at', { ascending: true });

            // Si se especifica operador, filtrar por sus solicitudes
            if (operadorId) {
                query = query.eq('solicitudes_credito.operador_id', operadorId);
            }

            const { data: documentos, error } = await query;

            if (error) throw error;
            return documentos || [];

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerParaEvaluacion:', error);
            throw error;
        }
    }

    /**
     * Registrar evaluación de documento
     */
    static async registrarEvaluacion(evaluacionData) {
        try {
            const { data: evaluacion, error } = await supabase
                .from('condiciones_aprobacion')
                .insert([evaluacionData])
                .select()
                .single();

            if (error) throw error;
            return evaluacion;

        } catch (error) {
            console.error('. Error en DocumentoModel.registrarEvaluacion:', error);
            throw error;
        }
    }

    /**
     * Obtener historial de evaluaciones de documento
     */
    static async obtenerHistorialEvaluaciones(documentoId) {
        try {
            const { data: evaluaciones, error } = await supabase
                .from('condiciones_aprobacion')
                .select(`
                    *,
                    usuarios: creado_por (
                        nombre_completo,
                        email
                    )
                `)
                .eq('documento_id', documentoId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return evaluaciones || [];

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerHistorialEvaluaciones:', error);
            throw error;
        }
    }

    /**
     * Verificar permisos de usuario sobre documento
     */
    static async verificarPermisos(documentoId, usuarioId, usuarioRol) {
        try {
            const documento = await this.obtenerPorId(documentoId);
            if (!documento) return false;

            // Obtener información de la solicitud
            const { data: solicitud, error } = await supabase
                .from('solicitudes_credito')
                .select('solicitante_id, operador_id')
                .eq('id', documento.solicitud_id)
                .single();

            if (error || !solicitud) return false;

            // Administradores y operadores pueden acceder a cualquier documento
            if (['admin', 'operador'].includes(usuarioRol)) {
                return true;
            }

            // Solicitantes solo pueden acceder a sus propios documentos
            if (usuarioRol === 'solicitante') {
                return solicitud.solicitante_id === usuarioId;
            }

            return false;

        } catch (error) {
            console.error('. Error en DocumentoModel.verificarPermisos:', error);
            return false;
        }
    }

    /**
     * Obtener documentos agrupados por tipo
     */
    static async obtenerAgrupadosPorTipo(solicitudId) {
        try {
            const { data: documentos, error } = await supabase
                .from('documentos')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .order('tipo', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;

            const agrupados = {};
            if (documentos) {
                documentos.forEach(doc => {
                    if (!agrupados[doc.tipo]) {
                        agrupados[doc.tipo] = [];
                    }
                    agrupados[doc.tipo].push(doc);
                });
            }

            return agrupados;

        } catch (error) {
            console.error('. Error en DocumentoModel.obtenerAgrupadosPorTipo:', error);
            throw error;
        }
    }
}

module.exports = DocumentoModel;