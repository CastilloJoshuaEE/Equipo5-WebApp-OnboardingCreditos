// modelos/TransferenciasBancariasModel.js
const { supabase } = require('../config/conexion');

class TransferenciasBancariasModel {
    
    /**
     * Verificar estado de firma digital para transferencia
     */
    static async verificarEstadoFirma(solicitud_id) {
        try {
            const { data: firmas, error } = await supabase
                .from('firmas_digitales')
                .select('estado, fecha_firma_completa, integridad_valida, fecha_firma_solicitante, fecha_firma_operador')
                .eq('solicitud_id', solicitud_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return firmas || [];

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.verificarEstadoFirma:', error);
            throw error;
        }
    }

    /**
     * Verificar transferencia existente para solicitud
     */
    static async verificarTransferenciaExistente(solicitud_id) {
        try {
            const { data: transferencia, error } = await supabase
                .from('transferencias_bancarias')
                .select('id, estado, numero_comprobante')
                .eq('solicitud_id', solicitud_id)
                .in('estado', ['pendiente', 'procesando', 'completada'])
                .maybeSingle();

            if (error) throw error;
            return transferencia;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.verificarTransferenciaExistente:', error);
            throw error;
        }
    }

    /**
     * Obtener información de solicitud para transferencia
     */
    static async obtenerSolicitud(solicitud_id) {
        try {
            const { data: solicitud, error } = await supabase
                .from('solicitudes_credito')
                .select('operador_id, monto, moneda, estado, solicitante_id, numero_solicitud')
                .eq('id', solicitud_id)
                .single();

            if (error) throw error;
            return solicitud;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.obtenerSolicitud:', error);
            throw error;
        }
    }

    /**
     * Obtener información de contacto bancario
     */
    static async obtenerContactoBancario(contacto_bancario_id) {
        try {
            const { data: contacto, error } = await supabase
                .from('contactos_bancarios')
                .select('*, solicitantes: solicitante_id(*)')
                .eq('id', contacto_bancario_id)
                .single();

            if (error) throw error;
            return contacto;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.obtenerContactoBancario:', error);
            throw error;
        }
    }

    /**
     * Obtener contrato relacionado con solicitud
     */
    static async obtenerContrato(solicitud_id) {
        try {
            const { data: contrato, error } = await supabase
                .from('contratos')
                .select('id')
                .eq('solicitud_id', solicitud_id)
                .single();

            if (error) throw error;
            return contrato;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.obtenerContrato:', error);
            throw error;
        }
    }

    /**
     * Crear nueva transferencia bancaria
     */
    static async crear(transferenciaData) {
        try {
            const { data: transferencia, error } = await supabase
                .from('transferencias_bancarias')
                .insert([transferenciaData])
                .select()
                .single();

            if (error) throw error;
            return transferencia;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.crear:', error);
            throw error;
        }
    }

    /**
     * Actualizar estado de transferencia
     */
    static async actualizarEstado(transferencia_id, estado, datosAdicionales = {}) {
        try {
            const updateData = {
                estado,
                updated_at: new Date().toISOString(),
                ...datosAdicionales
            };

            const { data: transferencia, error } = await supabase
                .from('transferencias_bancarias')
                .update(updateData)
                .eq('id', transferencia_id)
                .select()
                .single();

            if (error) throw error;
            return transferencia;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.actualizarEstado:', error);
            throw error;
        }
    }

    /**
     * Obtener transferencia por ID
     */
    static async obtenerPorId(transferencia_id) {
        try {
            const { data: transferencia, error } = await supabase
                .from('transferencias_bancarias')
                .select(`
                    *,
                    solicitudes_credito (
                        numero_solicitud,
                        solicitante_id,
                        operador_id,
                        monto,
                        moneda,
                        solicitantes: solicitante_id (
                            usuarios (*)
                        ),
                        operadores: operador_id (
                            usuarios (*)
                        )
                    ),
                    contactos_bancarios (*)
                `)
                .eq('id', transferencia_id)
                .single();

            if (error) throw error;
            return transferencia;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.obtenerPorId:', error);
            throw error;
        }
    }

    /**
     * Obtener información de comprobante
     */
    static async obtenerInfoComprobante(transferencia_id) {
        try {
            const { data: transferencia, error } = await supabase
                .from('transferencias_bancarias')
                .select('ruta_comprobante, numero_comprobante, estado')
                .eq('id', transferencia_id)
                .single();

            if (error) throw error;
            return transferencia;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.obtenerInfoComprobante:', error);
            throw error;
        }
    }

    /**
     * Obtener historial de transferencias por usuario
     */
    static async obtenerHistorialPorUsuario(usuario_id, usuario_rol) {
        try {
            let query = supabase
                .from('transferencias_bancarias')
                .select(`
                    *,
                    solicitudes_credito (
                        numero_solicitud,
                        solicitante_id,
                        operador_id
                    ),
                    contactos_bancarios (
                        numero_cuenta,
                        nombre_banco,
                        tipo_cuenta,
                        solicitante_id
                    )
                `)
                .order('created_at', { ascending: false });

            // Filtrar por rol
            if (usuario_rol === 'solicitante') {
                query = query.eq('solicitudes_credito.solicitante_id', usuario_id);
            } else if (usuario_rol === 'operador') {
                query = query.eq('solicitudes_credito.operador_id', usuario_id);
            }

            const { data: transferencias, error } = await query;

            if (error) throw error;
            return transferencias || [];

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.obtenerHistorialPorUsuario:', error);
            throw error;
        }
    }

    /**
     * Obtener transferencias del solicitante
     */
    static async obtenerTransferenciasSolicitante(usuario_id) {
        try {
            const { data: transferencias, error } = await supabase
                .from('transferencias_bancarias')
                .select(`
                    *,
                    solicitudes_credito!inner(
                        numero_solicitud,
                        solicitante_id,
                        operador_id
                    ),
                    contactos_bancarios(
                        nombre_banco,
                        numero_cuenta,
                        tipo_cuenta
                    )
                `)
                .eq('solicitudes_credito.solicitante_id', usuario_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return transferencias || [];

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.obtenerTransferenciasSolicitante:', error);
            throw error;
        }
    }

    /**
     * Actualizar ruta de comprobante
     */
    static async actualizarRutaComprobante(transferencia_id, ruta_comprobante) {
        try {
            const { data: transferencia, error } = await supabase
                .from('transferencias_bancarias')
                .update({
                    ruta_comprobante,
                    updated_at: new Date().toISOString()
                })
                .eq('id', transferencia_id)
                .select()
                .single();

            if (error) throw error;
            return transferencia;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.actualizarRutaComprobante:', error);
            throw error;
        }
    }

    /**
     * Crear notificaciones de transferencia
     */
    static async crearNotificaciones(notificacionesData) {
        try {
            const { data: notificaciones, error } = await supabase
                .from('notificaciones')
                .insert(notificacionesData)
                .select();

            if (error) throw error;
            return notificaciones || [];

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.crearNotificaciones:', error);
            throw error;
        }
    }

    /**
     * Marcar solicitud como cerrada
     */
    static async marcarSolicitudComoCerrada(solicitud_id) {
        try {
            const { error } = await supabase
                .from('solicitudes_credito')
                .update({
                    estado: 'aprobada',
                    updated_at: new Date().toISOString()
                })
                .eq('id', solicitud_id);

            if (error) throw error;

            // También actualizar el contrato
            await supabase
                .from('contratos')
                .update({
                    estado: 'cerrado',
                    updated_at: new Date().toISOString()
                })
                .eq('solicitud_id', solicitud_id);

            return { success: true, message: 'Solicitud marcada como cerrada' };

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.marcarSolicitudComoCerrada:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de transferencias
     */
    static async obtenerEstadisticas(usuario_id = null, usuario_rol = null) {
        try {
            let query = supabase
                .from('transferencias_bancarias')
                .select('estado, monto, moneda', { count: 'exact', head: true });

            // Filtrar por usuario si se especifica
            if (usuario_id && usuario_rol) {
                if (usuario_rol === 'solicitante') {
                    query = query.in('solicitud_id', 
                        supabase
                            .from('solicitudes_credito')
                            .select('id')
                            .eq('solicitante_id', usuario_id)
                    );
                } else if (usuario_rol === 'operador') {
                    query = query.in('solicitud_id', 
                        supabase
                            .from('solicitudes_credito')
                            .select('id')
                            .eq('operador_id', usuario_id)
                    );
                }
            }

            const { count: total, error: totalError } = await query;
            if (totalError) throw totalError;

            // Contar por estados
            const estados = ['pendiente', 'procesando', 'completada', 'fallida'];
            const estadisticas = { total: total || 0 };

            for (const estado of estados) {
                let estadoQuery = supabase
                    .from('transferencias_bancarias')
                    .select('*', { count: 'exact', head: true })
                    .eq('estado', estado);

                if (usuario_id && usuario_rol) {
                    if (usuario_rol === 'solicitante') {
                        estadoQuery = estadoQuery.in('solicitud_id', 
                            supabase
                                .from('solicitudes_credito')
                                .select('id')
                                .eq('solicitante_id', usuario_id)
                        );
                    } else if (usuario_rol === 'operador') {
                        estadoQuery = estadoQuery.in('solicitud_id', 
                            supabase
                                .from('solicitudes_credito')
                                .select('id')
                                .eq('operador_id', usuario_id)
                        );
                    }
                }

                const { count, error } = await estadoQuery;
                if (!error) {
                    estadisticas[estado] = count || 0;
                }
            }

            // Calcular monto total
            let montoQuery = supabase
                .from('transferencias_bancarias')
                .select('monto, moneda')
                .eq('estado', 'completada');

            if (usuario_id && usuario_rol) {
                if (usuario_rol === 'solicitante') {
                    montoQuery = montoQuery.in('solicitud_id', 
                        supabase
                            .from('solicitudes_credito')
                            .select('id')
                            .eq('solicitante_id', usuario_id)
                    );
                } else if (usuario_rol === 'operador') {
                    montoQuery = montoQuery.in('solicitud_id', 
                        supabase
                            .from('solicitudes_credito')
                            .select('id')
                            .eq('operador_id', usuario_id)
                    );
                }
            }

            const { data: montos, error: montoError } = await montoQuery;
            if (!montoError && montos) {
                const montoTotalUSD = montos
                    .filter(t => t.moneda === 'USD')
                    .reduce((sum, t) => sum + (t.monto || 0), 0);
                
                const montoTotalARS = montos
                    .filter(t => t.moneda === 'ARS')
                    .reduce((sum, t) => sum + (t.monto || 0), 0);

                estadisticas.monto_total = {
                    USD: montoTotalUSD,
                    ARS: montoTotalARS
                };
            }

            return estadisticas;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.obtenerEstadisticas:', error);
            throw error;
        }
    }

    /**
     * Generar número de comprobante único
     */
    static generarNumeroComprobante() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `TRF-${timestamp}-${randomString}`;
    }

    /**
     * Validar datos de transferencia
     */
    static validarDatosTransferencia(transferenciaData) {
        const errores = [];

        if (!transferenciaData.solicitud_id) {
            errores.push('Solicitud ID es requerido');
        }

        if (!transferenciaData.contacto_bancario_id) {
            errores.push('Contacto bancario ID es requerido');
        }

        if (!transferenciaData.monto || transferenciaData.monto <= 0) {
            errores.push('Monto válido es requerido');
        }

        if (!transferenciaData.moneda) {
            errores.push('Moneda es requerida');
        }

        if (errores.length > 0) {
            throw new Error(`Datos de transferencia inválidos: ${errores.join(', ')}`);
        }

        return true;
    }

    /**
     * Verificar permisos de usuario sobre transferencia
     */
    static async verificarPermisos(transferencia_id, usuario_id, usuario_rol) {
        try {
            const transferencia = await this.obtenerPorId(transferencia_id);
            if (!transferencia) return false;

            const solicitud = transferencia.solicitudes_credito;
            if (!solicitud) return false;

            // Administradores y operadores pueden acceder a cualquier transferencia
            if (['admin', 'operador'].includes(usuario_rol)) {
                return true;
            }

            // Solicitantes solo pueden acceder a sus propias transferencias
            if (usuario_rol === 'solicitante') {
                return solicitud.solicitante_id === usuario_id;
            }

            return false;

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.verificarPermisos:', error);
            return false;
        }
    }

    /**
     * Obtener transferencias recientes (para dashboard)
     */
    static async obtenerRecientes(limite = 10) {
        try {
            const { data: transferencias, error } = await supabase
                .from('transferencias_bancarias')
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
            return transferencias || [];

        } catch (error) {
            console.error('. Error en TransferenciasBancariasModel.obtenerRecientes:', error);
            throw error;
        }
    }
}

module.exports = TransferenciasBancariasModel;