const { supabase } = require('../config/conexion');

class ComentariosModel {
    
    /**
     * Crear un nuevo comentario
     */
    static async crear(comentarioData) {
        try {
            const { data: nuevoComentario, error } = await supabase
                .from('comentarios_solicitud')
                .insert([comentarioData])
                .select()
                .single();

            if (error) throw error;
            return nuevoComentario;

        } catch (error) {
            console.error('. Error en ComentariosModel.crear:', error);
            throw error;
        }
    }

    /**
     * Obtener comentarios de una solicitud
     */
    static async obtenerPorSolicitud(solicitud_id, filtros = {}) {
        try {
            const { tipo, limit = 50, offset = 0 } = filtros;

            let query = supabase
                .from('comentarios_solicitud')
                .select(`
                    *,
                    usuarios:usuario_id(
                        nombre_completo,
                        email,
                        rol
                    )
                `)
                .eq('solicitud_id', solicitud_id)
                .order('created_at', { ascending: false })
                .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

            if (tipo) {
                query = query.eq('tipo', tipo);
            }

            const { data: comentarios, error } = await query;

            if (error) throw error;
            return comentarios || [];

        } catch (error) {
            console.error('. Error en ComentariosModel.obtenerPorSolicitud:', error);
            throw error;
        }
    }

    /**
     * Obtener comentario por ID
     */
    static async obtenerPorId(id) {
        try {
            const { data: comentario, error } = await supabase
                .from('comentarios_solicitud')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return comentario;

        } catch (error) {
            console.error('. Error en ComentariosModel.obtenerPorId:', error);
            throw error;
        }
    }

    /**
     * Marcar comentarios como leídos
     */
    static async marcarComoLeidos(solicitud_id, usuario_id) {
        try {
            const { error } = await supabase
                .from('comentarios_solicitud')
                .update({ 
                    leido: true,
                    updated_at: new Date().toISOString()
                })
                .eq('solicitud_id', solicitud_id)
                .eq('leido', false)
                .neq('usuario_id', usuario_id);

            if (error) {
                console.error('. Error marcando comentarios como leídos:', error);
                return false;
            }

            console.log(`. Comentarios marcados como leídos para usuario: ${usuario_id}`);
            return true;

        } catch (error) {
            console.error('. Error en ComentariosModel.marcarComoLeidos:', error);
            return false;
        }
    }

    /**
     * Obtener contador de comentarios no leídos
     */
    static async obtenerContadorNoLeidos(usuario_id) {
        try {
            const { count, error } = await supabase
                .from('comentarios_solicitud')
                .select('*', { count: 'exact', head: true })
                .eq('leido', false)
                .neq('usuario_id', usuario_id)
                .in('solicitud_id', 
                    supabase
                        .from('solicitudes_credito')
                        .select('id')
                        .or(`solicitante_id.eq.${usuario_id},operador_id.eq.${usuario_id}`)
                );

            if (error) throw error;
            return count || 0;

        } catch (error) {
            console.error('. Error en ComentariosModel.obtenerContadorNoLeidos:', error);
            throw error;
        }
    }

    /**
     * Eliminar comentario
     */
    static async eliminar(id) {
        try {
            const { error } = await supabase
                .from('comentarios_solicitud')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;

        } catch (error) {
            console.error('. Error en ComentariosModel.eliminar:', error);
            throw error;
        }
    }

    /**
     * Verificar permisos de usuario sobre comentario
     */
    static async verificarPermisos(comentario_id, usuario_id, usuario_rol) {
        try {
            const comentario = await this.obtenerPorId(comentario_id);
            if (!comentario) return false;

            // El autor siempre tiene permisos
            if (comentario.usuario_id === usuario_id) return true;

            // Los operadores tienen permisos sobre todos los comentarios
            if (usuario_rol === 'operador') return true;

            return false;

        } catch (error) {
            console.error('. Error en ComentariosModel.verificarPermisos:', error);
            return false;
        }
    }

    /**
     * Verificar permisos de usuario sobre solicitud
     */
    static async verificarPermisosSolicitud(solicitud_id, usuario_id, usuario_rol) {
        try {
            const { data: solicitud, error } = await supabase
                .from('solicitudes_credito')
                .select('solicitante_id, operador_id')
                .eq('id', solicitud_id)
                .single();

            if (error || !solicitud) return false;

            // Solicitante solo puede acceder a sus propias solicitudes
            if (usuario_rol === 'solicitante' && solicitud.solicitante_id !== usuario_id) {
                return false;
            }

            // Operador solo puede acceder a solicitudes asignadas
            if (usuario_rol === 'operador' && solicitud.operador_id !== usuario_id) {
                return false;
            }

            return true;

        } catch (error) {
            console.error('. Error en ComentariosModel.verificarPermisosSolicitud:', error);
            return false;
        }
    }

    /**
     * Obtener estadísticas de comentarios
     */
    static async obtenerEstadisticas(usuario_id, usuario_rol) {
        try {
            let query = supabase
                .from('comentarios_solicitud')
                .select('*', { count: 'exact', head: true });

            // Filtrar por solicitudes del usuario
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

            const { count: total, error: totalError } = await query;
            if (totalError) throw totalError;

            // Contar no leídos
            const { count: noLeidos, error: noLeidosError } = await supabase
                .from('comentarios_solicitud')
                .select('*', { count: 'exact', head: true })
                .eq('leido', false)
                .neq('usuario_id', usuario_id)
                .in('solicitud_id', 
                    supabase
                        .from('solicitudes_credito')
                        .select('id')
                        .or(`solicitante_id.eq.${usuario_id},operador_id.eq.${usuario_id}`)
                );

            if (noLeidosError) throw noLeidosError;

            return {
                total: total || 0,
                no_leidos: noLeidos || 0
            };

        } catch (error) {
            console.error('. Error en ComentariosModel.obtenerEstadisticas:', error);
            throw error;
        }
    }

    /**
     * Buscar comentarios por texto
     */
    static async buscar(texto, usuario_id, usuario_rol, limit = 20) {
        try {
            let query = supabase
                .from('comentarios_solicitud')
                .select(`
                    *,
                    usuarios:usuario_id(
                        nombre_completo,
                        email,
                        rol
                    ),
                    solicitudes_credito(
                        numero_solicitud,
                        estado
                    )
                `)
                .ilike('comentario', `%${texto}%`)
                .order('created_at', { ascending: false })
                .limit(limit);

            // Filtrar por permisos del usuario
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

            const { data: comentarios, error } = await query;

            if (error) throw error;
            return comentarios || [];

        } catch (error) {
            console.error('. Error en ComentariosModel.buscar:', error);
            throw error;
        }
    }
}

module.exports = ComentariosModel;