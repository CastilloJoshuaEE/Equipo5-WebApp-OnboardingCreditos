const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');

class FirmaDigitalModel {
    
    /**
     * Obtener firma por ID
     */
    static async obtenerPorId(firmaId) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select(`
                    *,
                    contratos (
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
                    )
                `)
                .eq('id', firmaId)
                .single();

            if (error) throw error;
            return firma;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.obtenerPorId:', error);
            throw error;
        }
    }

    /**
     * Obtener firma por solicitud ID
     */
    static async obtenerPorSolicitud(solicitudId) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return firma;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.obtenerPorSolicitud:', error);
            throw error;
        }
    }

    /**
     * Crear nueva firma digital
     */
    static async crear(firmaData) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .insert([firmaData])
                .select()
                .single();

            if (error) throw error;
            return firma;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.crear:', error);
            throw error;
        }
    }

    /**
     * Actualizar firma digital
     */
    static async actualizar(firmaId, updateData) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .update(updateData)
                .eq('id', firmaId)
                .select()
                .single();

            if (error) throw error;
            return firma;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.actualizar:', error);
            throw error;
        }
    }

    /**
     * Verificar estado de firma para proceso
     */
    static async verificarEstadoParaFirma(firmaId) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select(`
                    id,
                    estado,
                    fecha_expiracion,
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
            console.error('. Error en FirmaDigitalModel.verificarEstadoParaFirma:', error);
            throw error;
        }
    }

    /**
     * Obtener información para página de firma
     */
    static async obtenerInfoParaFirma(firmaId) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select(`
                    id,
                    estado,
                    fecha_expiracion,
                    hash_documento_original,
                    contrato_id,
                    solicitud_id,
                    contratos (
                        id,
                        ruta_documento,
                        solicitud_id,
                        numero_contrato,
                        estado
                    ),
                    solicitudes_credito (
                        numero_solicitud,
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', firmaId)
                .single();

            if (error) throw error;
            return firma;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.obtenerInfoParaFirma:', error);
            throw error;
        }
    }

    
    /**
     * Obtener firmas pendientes por usuario
     */
    static async obtenerPendientesPorUsuario(usuarioId, usuarioRol) {
        try {
            let query = supabase
                .from('firmas_digitales')
                .select(`
                    *,
                    contratos(*),
                    solicitudes_credito(
                        numero_solicitud,
                        monto,
                        solicitante_id,
                        operador_id,
                        solicitantes: solicitantes!solicitante_id(
                            usuarios(*)
                        )
                    )
                `)
                .in('estado', ['enviado', 'firmado_solicitante', 'firmado_operador'])
                .order('fecha_envio', { ascending: true });

            // Filtrar por rol
            if (usuarioRol === 'solicitante') {
                query = query.eq('solicitudes_credito.solicitante_id', usuarioId);
            } else if (usuarioRol === 'operador') {
                query = query.eq('solicitudes_credito.operador_id', usuarioId);
            }

            const { data: firmas, error } = await query;

            if (error) throw error;
            return firmas || [];

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.obtenerPendientesPorUsuario:', error);
            throw error;
        }
    }

    /**
     * Verificar si existe firma activa para solicitud
     */
    static async verificarFirmaActiva(solicitudId) {
        try {
            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .select('*')
                .eq('solicitud_id', solicitudId)
                .in('estado', ['pendiente', 'enviado', 'firmado_solicitante', 'firmado_operador'])
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return firma;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.verificarFirmaActiva:', error);
            throw error;
        }
    }

    /**
     * Obtener auditoría de firma
     */
    static async obtenerAuditoria(firmaId) {
        try {
            const { data: auditoria, error } = await supabase
                .from('auditoria_firmas')
                .select(`
                    *,
                    usuarios: usuario_id(
                        nombre_completo,
                        email
                    )
                `)
                .eq('firma_id', firmaId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return auditoria || [];

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.obtenerAuditoria:', error);
            throw error;
        }
    }

    /**
     * Registrar evento de auditoría
     */
    static async registrarAuditoria(auditoriaData) {
        try {
            const { data: auditoria, error } = await supabase
                .from('auditoria_firmas')
                .insert([auditoriaData])
                .select()
                .single();

            if (error) throw error;
            return auditoria;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.registrarAuditoria:', error);
            throw error;
        }
    }

    /**
     * Verificar permisos de usuario sobre firma
     */
static async verificarPermisos(firmaId, usuarioId, usuarioRol) {
    try {
        const firma = await this.obtenerPorId(firmaId);
        if (!firma) return false;

        // Obtener información completa de la solicitud
        const { data: solicitud, error } = await supabase
            .from('solicitudes_credito')
            .select(`
                solicitante_id,
                operador_id,
                contratos!inner(id)
            `)
            .eq('id', firma.solicitud_id)
            .single();

        if (error || !solicitud) return false;

        console.log('. Verificando permisos:', {
            usuarioId,
            usuarioRol,
            solicitante_id: solicitud.solicitante_id,
            operador_id: solicitud.operador_id,
            firmaId
        });

        // PERMITIR ACCESO A:
        // 1. El solicitante de la solicitud (CRÍTICO)
        // 2. El operador asignado a la solicitud  
        // 3. Cualquier operador (para flexibilidad)
        if (usuarioRol === 'solicitante') {
            const tieneAcceso = solicitud.solicitante_id === usuarioId;
            console.log('. Acceso solicitante:', tieneAcceso);
            return tieneAcceso;
        } else if (usuarioRol === 'operador') {
            // Permitir si es el operador asignado O cualquier operador
            const tieneAcceso = solicitud.operador_id === usuarioId || true;
            console.log('. Acceso operador:', tieneAcceso);
            return tieneAcceso;
        }

        console.log('. Sin permisos: rol no reconocido');
        return false;

    } catch (error) {
        console.error('. Error en FirmaDigitalModel.verificarPermisos:', error);
        return false;
    }
}
    /**
     * Obtener estadísticas de firmas
     */
    static async obtenerEstadisticas(usuarioId = null, usuarioRol = null) {
        try {
            let query = supabase
                .from('firmas_digitales')
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
            const estados = ['pendiente', 'enviado', 'firmado_solicitante', 'firmado_operador', 'firmado_completo', 'expirado'];
            const estadisticas = { total: total || 0 };

            for (const estado of estados) {
                let estadoQuery = supabase
                    .from('firmas_digitales')
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
            console.error('. Error en FirmaDigitalModel.obtenerEstadisticas:', error);
            throw error;
        }
    }

    /**
     * Renovar firma expirada
     */
    static async renovarFirmaExpirada(firmaId) {
        try {
            const updateData = {
                estado: 'enviado',
                fecha_envio: new Date().toISOString(),
                fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                intentos_envio: supabase.raw('intentos_envio + 1'),
                updated_at: new Date().toISOString()
            };

            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .update(updateData)
                .eq('id', firmaId)
                .select()
                .single();

            if (error) throw error;
            return firma;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.renovarFirmaExpirada:', error);
            throw error;
        }
    }

    /**
     * Reparar relación firma-contrato
     */
    static async repararRelacionFirmaContrato(firmaId) {
        try {
            // Obtener firma
            const firma = await this.obtenerPorId(firmaId);
            if (!firma) {
                throw new Error('Firma no encontrada');
            }

            // Buscar contrato por solicitud_id
            const { data: contrato, error: contratoError } = await supabase
                .from('contratos')
                .select('*')
                .eq('solicitud_id', firma.solicitud_id)
                .single();

            if (contratoError || !contrato) {
                throw new Error('No se encontró contrato para esta solicitud');
            }

            // Actualizar la firma con el contrato_id correcto
            const { data: firmaActualizada, error: updateError } = await supabase
                .from('firmas_digitales')
                .update({ 
                    contrato_id: contrato.id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', firmaId)
                .select()
                .single();

            if (updateError) throw updateError;
            return { firma: firmaActualizada, contrato };

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.repararRelacionFirmaContrato:', error);
            throw error;
        }
    }

    /**
     * Verificar si se puede reiniciar proceso de firma
     */
    static async verificarPuedeReiniciar(firmaId) {
        try {
            const firma = await this.obtenerPorId(firmaId);
            if (!firma) return true;

            const tiempoTranscurrido = Date.now() - new Date(firma.created_at).getTime();
            const minutosTranscurridos = tiempoTranscurrido / (1000 * 60);

            // Permitir reinicio después de 30 minutos o si hay menos de 3 intentos
            if (minutosTranscurridos > 30 || (firma.intentos_envio || 0) < 3) {
                return true;
            }

            return false;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.verificarPuedeReiniciar:', error);
            return true; // Por defecto permitir reinicio en caso de error
        }
    }

    /**
     * Obtener documento para firma
     */
    static async obtenerDocumentoParaFirma(firmaId) {
        try {
            const firma = await this.obtenerPorId(firmaId);
            if (!firma || !firma.contratos?.ruta_documento) {
                throw new Error('Documento no encontrado');
            }

            const { data: fileData, error } = await supabase.storage
                .from('kyc-documents')
                .download(firma.contratos.ruta_documento);

            if (error) throw error;
            return fileData;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.obtenerDocumentoParaFirma:', error);
            throw error;
        }
    }

    /**
     * Actualizar URLs de firma
     */
    static async actualizarUrlsFirma(firmaId, urlsFirma) {
        try {
            const updateData = {
                url_firma_solicitante: urlsFirma.solicitante,
                url_firma_operador: urlsFirma.operador,
                updated_at: new Date().toISOString()
            };

            const { data: firma, error } = await supabase
                .from('firmas_digitales')
                .update(updateData)
                .eq('id', firmaId)
                .select()
                .single();

            if (error) throw error;
            return firma;

        } catch (error) {
            console.error('. Error en FirmaDigitalModel.actualizarUrlsFirma:', error);
            throw error;
        }
    }
}

module.exports = FirmaDigitalModel;