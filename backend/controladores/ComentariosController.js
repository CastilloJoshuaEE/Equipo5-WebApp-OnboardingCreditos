// controladores/ComentariosController.js
const { supabase } = require('../config/conexion');

class ComentariosController {
    
    /**
     * Crear comentario adicional
     */
    static async crearComentario(req, res) {
        try {
            const { solicitud_id, comentario, tipo = 'operador_a_solicitante' } = req.body;
            const usuario_id = req.usuario.id;

            console.log(`💬 Creando comentario para solicitud: ${solicitud_id}`, {
                usuario_id,
                tipo,
                comentario: comentario.substring(0, 100) + '...'
            });

            // Validaciones
            if (!solicitud_id || !comentario) {
                return res.status(400).json({
                    success: false,
                    message: 'Solicitud ID y comentario son requeridos'
                });
            }

            // Verificar que la solicitud existe y el usuario tiene permisos
            const { data: solicitud, error: solError } = await supabase
                .from('solicitudes_credito')
                .select('id, solicitante_id, operador_id, estado')
                .eq('id', solicitud_id)
                .single();

            if (solError || !solicitud) {
                return res.status(404).json({
                    success: false,
                    message: 'Solicitud no encontrada'
                });
            }

            // Verificar permisos según el rol
            if (req.usuario.rol === 'operador') {
                // Operador solo puede comentar en solicitudes asignadas
                if (solicitud.operador_id !== usuario_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para comentar en esta solicitud'
                    });
                }
            } else if (req.usuario.rol === 'solicitante') {
                // Solicitante solo puede comentar en sus propias solicitudes
                if (solicitud.solicitante_id !== usuario_id) {
                    return res.status(403).json({
                        success: false,
                        message: 'No tienes permisos para comentar en esta solicitud'
                    });
                }
            }

            // Insertar comentario
            const comentarioData = {
                solicitud_id,
                usuario_id,
                tipo,
                comentario: comentario.trim(),
                leido: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: nuevoComentario, error: insertError } = await supabase
                .from('comentarios_solicitud')
                .insert([comentarioData])
                .select()
                .single();

            if (insertError) {
                console.error('. Error insertando comentario:', insertError);
                throw insertError;
            }

            // . CREAR NOTIFICACIÓN PARA EL DESTINATARIO
            await ComentariosController.crearNotificacionComentario(
                solicitud, 
                nuevoComentario, 
                req.usuario
            );

            console.log(`. Comentario creado exitosamente: ${nuevoComentario.id}`);

            res.status(201).json({
                success: true,
                message: 'Comentario enviado exitosamente',
                data: nuevoComentario
            });

        } catch (error) {
            console.error('. Error en crearComentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear comentario: ' + error.message
            });
        }
    }

    /**
     * Crear notificación cuando se agrega un comentario
     */
    static async crearNotificacionComentario(solicitud, comentario, usuarioOrigen) {
        try {
            let usuarioDestino = null;
            let titulo = '';
            let mensaje = '';

            if (comentario.tipo === 'operador_a_solicitante') {
                // Notificar al solicitante
                usuarioDestino = solicitud.solicitante_id;
                titulo = 'Nuevo comentario del operador';
                mensaje = `El operador ha enviado un comentario sobre tu solicitud: "${comentario.comentario.substring(0, 100)}..."`;
            } else if (comentario.tipo === 'solicitante_a_operador') {
                // Notificar al operador
                usuarioDestino = solicitud.operador_id;
                titulo = 'Nuevo comentario del solicitante';
                mensaje = `El solicitante ha respondido a tu comentario: "${comentario.comentario.substring(0, 100)}..."`;
            }

            if (usuarioDestino) {
                const notificacionData = {
                    usuario_id: usuarioDestino,
                    solicitud_id: solicitud.id,
                    tipo: 'nuevo_comentario',
                    titulo: titulo,
                    mensaje: mensaje,
                    leida: false,
                    datos_adicionales: {
                        comentario_id: comentario.id,
                        tipo_comentario: comentario.tipo,
                        usuario_origen: usuarioOrigen.nombre_completo,
                        comentario_preview: comentario.comentario.substring(0, 100)
                    },
                    created_at: new Date().toISOString()
                };

                const { error: notifError } = await supabase
                    .from('notificaciones')
                    .insert([notificacionData]);

                if (notifError) {
                    console.error('. Error creando notificación:', notifError);
                } else {
                    console.log(`📨 Notificación enviada a usuario: ${usuarioDestino}`);
                }
            }
        } catch (error) {
            console.error('. Error en crearNotificacionComentario:', error);
        }
    }

    /**
     * Obtener comentarios de una solicitud
     */
    static async obtenerComentariosSolicitud(req, res) {
        try {
            const { solicitud_id } = req.params;
            const { tipo, limit = 50, offset = 0 } = req.query;

            console.log(`. Obteniendo comentarios para solicitud: ${solicitud_id}`);

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

            // Filtrar por tipo si se especifica
            if (tipo) {
                query = query.eq('tipo', tipo);
            }

            const { data: comentarios, error } = await query;

            if (error) {
                console.error('. Error obteniendo comentarios:', error);
                throw error;
            }

            // Marcar como leídos si el usuario actual es el destinatario
            if (comentarios && comentarios.length > 0) {
                await ComentariosController.marcarComentariosLeidos(solicitud_id, req.usuario.id);
            }

            console.log(`. Comentarios obtenidos: ${comentarios?.length || 0}`);

            res.json({
                success: true,
                data: comentarios || [],
                total: comentarios?.length || 0
            });

        } catch (error) {
            console.error('. Error en obtenerComentariosSolicitud:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener comentarios'
            });
        }
    }

    /**
     * Marcar comentarios como leídos
     */
    static async marcarComentariosLeidos(solicitud_id, usuario_id) {
        try {
            const { error } = await supabase
                .from('comentarios_solicitud')
                .update({ 
                    leido: true,
                    updated_at: new Date().toISOString()
                })
                .eq('solicitud_id', solicitud_id)
                .eq('leido', false)
                .neq('usuario_id', usuario_id); // No marcar los propios comentarios

            if (error) {
                console.error('. Error marcando comentarios como leídos:', error);
            } else {
                console.log(`. Comentarios marcados como leídos para usuario: ${usuario_id}`);
            }
        } catch (error) {
            console.error('. Error en marcarComentariosLeidos:', error);
        }
    }

    /**
     * Obtener contador de comentarios no leídos
     */
    static async obtenerContadorNoLeidos(req, res) {
        try {
            const usuario_id = req.usuario.id;

            const { count, error } = await supabase
                .from('comentarios_solicitud')
                .select('*', { count: 'exact', head: true })
                .eq('leido', false)
                .neq('usuario_id', usuario_id) // No contar los propios comentarios
                .in('solicitud_id', 
                    supabase
                        .from('solicitudes_credito')
                        .select('id')
                        .or(`solicitante_id.eq.${usuario_id},operador_id.eq.${usuario_id}`)
                );

            if (error) {
                console.error('. Error obteniendo contador de comentarios:', error);
                throw error;
            }

            res.json({
                success: true,
                data: {
                    count: count || 0
                }
            });

        } catch (error) {
            console.error('. Error en obtenerContadorNoLeidos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener contador de comentarios no leídos'
            });
        }
    }

    /**
     * Eliminar comentario (solo el propio o por operadores)
     */
    static async eliminarComentario(req, res) {
        try {
            const { id } = req.params;
            const usuario_id = req.usuario.id;

            console.log(`🗑️ Eliminando comentario: ${id}`);

            // Verificar que el comentario existe y pertenece al usuario
            const { data: comentario, error: comError } = await supabase
                .from('comentarios_solicitud')
                .select('*')
                .eq('id', id)
                .single();

            if (comError || !comentario) {
                return res.status(404).json({
                    success: false,
                    message: 'Comentario no encontrado'
                });
            }

            // Verificar permisos: solo el autor o un operador puede eliminar
            if (comentario.usuario_id !== usuario_id && req.usuario.rol !== 'operador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este comentario'
                });
            }

            const { error: deleteError } = await supabase
                .from('comentarios_solicitud')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw deleteError;
            }

            console.log(`. Comentario eliminado: ${id}`);

            res.json({
                success: true,
                message: 'Comentario eliminado exitosamente'
            });

        } catch (error) {
            console.error('. Error en eliminarComentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar comentario'
            });
        }
    }
}

module.exports = ComentariosController;