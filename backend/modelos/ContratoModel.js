const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');

class ContratoModel {
    
    /**
     * Obtener solicitud aprobada con información completa
     */
    static async obtenerSolicitudAprobada(solicitudId) {
        try {
            const { data: solicitud, error } = await supabaseAdmin
                .from('solicitudes_credito')
                .select(`
                    *,
                    solicitantes: solicitantes!solicitante_id(
                        usuarios(*),
                        nombre_empresa,
                        cuit,
                        representante_legal,
                        domicilio
                    ),
                    operadores: operadores!operador_id(
                        usuarios(*)
                    )
                `)
                .eq('id', solicitudId)
                .eq('estado', 'aprobado')
                .single();

            if (error) throw error;
            return solicitud;

        } catch (error) {
            console.error('. Error en ContratoModel.obtenerSolicitudAprobada:', error);
            throw error;
        }
    }

    /**
     * Crear nuevo contrato
     */
    static async crear(contratoData) {
        try {
            const { data: contrato, error } = await supabaseAdmin
                .from('contratos')
                .insert([contratoData])
                .select()
                .single();

            if (error) throw error;
            return contrato;

        } catch (error) {
            console.error('. Error en ContratoModel.crear:', error);
            throw error;
        }
    }

    /**
     * Obtener contrato por ID
     */
    static async obtenerPorId(contratoId) {
        try {
            const { data: contrato, error } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        *,
                        solicitantes(
                            usuarios(*),
                            nombre_empresa,
                            cuit,
                            representante_legal,
                            domicilio
                        ),
                        operadores(
                            usuarios(*)
                        )
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (error) throw error;
            return contrato;

        } catch (error) {
            console.error('. Error en ContratoModel.obtenerPorId:', error);
            throw error;
        }
    }

    /**
     * Obtener contrato por solicitud ID
     */
    static async obtenerPorSolicitud(solicitudId) {
    try {
        const { data: contrato, error } = await supabase
            .from('contratos')
            .select('*')
            .eq('solicitud_id', solicitudId)
            .single();

        // Si no se encuentra contrato, retornar null en lugar de lanzar error
        if (error && error.code === 'PGRST116') { // PGRST116 = no rows found
            return null;
        }
        
        if (error) throw error;
        return contrato;

    } catch (error) {
        console.error('. Error en ContratoModel.obtenerPorSolicitud:', error);
        throw error;
    }
}
    /**
     * Actualizar contrato
     */
    static async actualizar(contratoId, updateData) {
        try {
            const { data: contrato, error } = await supabase
                .from('contratos')
                .update(updateData)
                .eq('id', contratoId)
                .select()
                .single();

            if (error) throw error;
            return contrato;

        } catch (error) {
            console.error('. Error en ContratoModel.actualizar:', error);
            throw error;
        }
    }

    /**
     * Actualizar ruta del documento del contrato
     */
    static async actualizarRutaDocumento(contratoId, rutaDocumento) {
        try {
            const { data: contrato, error } = await supabase
                .from('contratos')
                .update({ 
                    ruta_documento: rutaDocumento,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contratoId)
                .select()
                .single();

            if (error) throw error;
            return contrato;

        } catch (error) {
            console.error('. Error en ContratoModel.actualizarRutaDocumento:', error);
            throw error;
        }
    }

    /**
     * Verificar estado del contrato para firma
     */
    static async verificarEstadoParaFirma(firmaId) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select(`
                    id,
                    estado,
                    contratos!inner(
                        ruta_documento,
                        estado
                    )
                `)
                .eq('id', firmaId)
                .single();

            if (error) throw error;
            return firma;

        } catch (error) {
            console.error('. Error en ContratoModel.verificarEstadoParaFirma:', error);
            throw error;
        }
    }

    /**
     * Obtener información de contrato para firma
     */
    static async obtenerParaFirma(firmaId) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select(`
                    id,
                    ruta_documento,
                    contratos!inner(
                        ruta_documento,
                        solicitud_id,
                        estado
                    )
                `)
                .eq('id', firmaId)
                .single();

            if (error) throw error;
            return firma;

        } catch (error) {
            console.error('. Error en ContratoModel.obtenerParaFirma:', error);
            throw error;
        }
    }

    /**
     * Descargar documento del contrato
     */
    static async descargarDocumento(rutaDocumento) {
        try {
            const { data: fileData, error } = await supabase.storage
                .from('kyc-documents')
                .download(rutaDocumento);

            if (error) throw error;
            return fileData;

        } catch (error) {
            console.error('. Error en ContratoModel.descargarDocumento:', error);
            throw error;
        }
    }

    /**
     * Subir documento del contrato
     */
    static async subirDocumento(rutaStorage, buffer, contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
            const { error } = await supabase.storage
                .from('kyc-documents')
                .upload(rutaStorage, buffer, {
                    contentType: contentType,
                    upsert: true
                });

            if (error) throw error;
            return true;

        } catch (error) {
            console.error('. Error en ContratoModel.subirDocumento:', error);
            throw error;
        }
    }

    /**
     * Obtener información de firmas del contrato
     */
    static async obtenerInformacionFirmas(solicitudId) {
        try {
            const { data: firmas, error } = await supabase
                .from('firmas_digitales')
                .select('fecha_firma_solicitante, fecha_firma_operador, hash_documento_firmado')
                .eq('solicitud_id', solicitudId)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return firmas;

        } catch (error) {
            console.error('. Error en ContratoModel.obtenerInformacionFirmas:', error);
            throw error;
        }
    }

    /**
     * Generar número de contrato único
     */
    static generarNumeroContrato(numeroSolicitud) {
        return `CONTR-${numeroSolicitud}-${Date.now()}`;
    }

    /**
     * Validar datos del contrato
     */
    static validarDatosContrato(contratoData) {
        const errors = [];

        if (!contratoData.solicitud_id) {
            errors.push('solicitud_id es requerido');
        }

        if (!contratoData.numero_contrato) {
            errors.push('numero_contrato es requerido');
        }

        if (!contratoData.monto_aprobado || contratoData.monto_aprobado <= 0) {
            errors.push('monto_aprobado debe ser mayor a 0');
        }

        if (!contratoData.tasa_interes || contratoData.tasa_interes <= 0) {
            errors.push('tasa_interes debe ser mayor a 0');
        }

        if (!contratoData.plazo_meses || contratoData.plazo_meses <= 0) {
            errors.push('plazo_meses debe ser mayor a 0');
        }

        return errors;
    }

    /**
     * Obtener contratos por usuario
     */
    static async obtenerPorUsuario(usuarioId, usuarioRol, filtros = {}) {
        try {
            let query = supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        *,
                        solicitantes(
                            usuarios(*),
                            nombre_empresa
                        )
                    )
                `);

            // Filtrar según el rol del usuario
            if (usuarioRol === 'solicitante') {
                query = query.in('solicitud_id', 
                    supabase
                        .from('solicitudes_credito')
                        .select('id')
                        .eq('solicitante_id', usuarioId)
                );
            } else if (usuarioRol === 'operador') {
                query = query.in('solicitud_id', 
                    supabase
                        .from('solicitudes_credito')
                        .select('id')
                        .eq('operador_id', usuarioId)
                );
            }

            // Aplicar filtros adicionales
            if (filtros.estado) {
                query = query.eq('estado', filtros.estado);
            }

            if (filtros.tipo) {
                query = query.eq('tipo', filtros.tipo);
            }

            query = query.order('created_at', { ascending: false });

            const { data: contratos, error } = await query;

            if (error) throw error;
            return contratos || [];

        } catch (error) {
            console.error('. Error en ContratoModel.obtenerPorUsuario:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de contratos
     */
    static async obtenerEstadisticas(usuarioId = null, usuarioRol = null) {
        try {
            let query = supabase
                .from('contratos')
                .select('estado', { count: 'exact', head: true });

            // Filtrar por usuario si se especifica
            if (usuarioId && usuarioRol) {
                if (usuarioRol === 'solicitante') {
                    query = query.in('solicitud_id', 
                        supabase
                            .from('solicitudes_credito')
                            .select('id')
                            .eq('solicitante_id', usuarioId)
                    );
                } else if (usuarioRol === 'operador') {
                    query = query.in('solicitud_id', 
                        supabase
                            .from('solicitudes_credito')
                            .select('id')
                            .eq('operador_id', usuarioId)
                    );
                }
            }

            const { count: total, error: totalError } = await query;
            if (totalError) throw totalError;

            // Contar por estados
            const estados = ['generado', 'firmado_solicitante', 'firmado_completo', 'vigente'];
            const estadisticas = { total: total || 0 };

            for (const estado of estados) {
                let estadoQuery = supabase
                    .from('contratos')
                    .select('*', { count: 'exact', head: true })
                    .eq('estado', estado);

                if (usuarioId && usuarioRol) {
                    if (usuarioRol === 'solicitante') {
                        estadoQuery = estadoQuery.in('solicitud_id', 
                            supabase
                                .from('solicitudes_credito')
                                .select('id')
                                .eq('solicitante_id', usuarioId)
                        );
                    } else if (usuarioRol === 'operador') {
                        estadoQuery = estadoQuery.in('solicitud_id', 
                            supabase
                                .from('solicitudes_credito')
                                .select('id')
                                .eq('operador_id', usuarioId)
                        );
                    }
                }

                const { count, error } = await estadoQuery;
                if (!error) {
                    estadisticas[estado] = count || 0;
                }
            }

            return estadisticas;

        } catch (error) {
            console.error('. Error en ContratoModel.obtenerEstadisticas:', error);
            throw error;
        }
    }

    /**
     * Verificar permisos de usuario sobre contrato
     */
    static async verificarPermisos(contratoId, usuarioId, usuarioRol) {
        try {
            const contrato = await this.obtenerPorId(contratoId);
            if (!contrato) return false;

            const solicitud = contrato.solicitudes_credito;

            if (usuarioRol === 'solicitante') {
                return solicitud.solicitante_id === usuarioId;
            } else if (usuarioRol === 'operador') {
                return solicitud.operador_id === usuarioId;
            }

            return false;

        } catch (error) {
            console.error('. Error en ContratoModel.verificarPermisos:', error);
            return false;
        }
    }
}

module.exports = ContratoModel;