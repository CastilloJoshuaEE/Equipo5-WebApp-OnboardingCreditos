const ComentariosModel = require('../modelos/ComentariosModel');
const NotificacionesController = require('./NotificacionesController');

class ComentariosController {
    
    /**
     * Crear comentario adicional
     */
    static async crearComentario(req, res) {
        try {
            const { solicitud_id, comentario, tipo = 'operador_a_solicitante' } = req.body;
            const usuario_id = req.usuario.id;
            const usuario_rol = req.usuario.rol;

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

            // Verificar permisos sobre la solicitud
            const tienePermisos = await ComentariosModel.verificarPermisosSolicitud(
                solicitud_id, usuario_id, usuario_rol
            );

            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para comentar en esta solicitud'
                });
            }

            // Preparar datos del comentario
            const comentarioData = {
                solicitud_id,
                usuario_id,
                tipo,
                comentario: comentario.trim(),
                leido: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Crear comentario usando el modelo
            const nuevoComentario = await ComentariosModel.crear(comentarioData);

            // Obtener información de la solicitud para la notificación
            const { supabase } = require('../config/conexion');
            const { data: solicitud } = await supabase
                .from('solicitudes_credito')
                .select('id, solicitante_id, operador_id, estado')
                .eq('id', solicitud_id)
                .single();

            // Crear notificación
            if (solicitud) {
                await NotificacionesController.crearNotificacionComentario(
                    solicitud, 
                    nuevoComentario, 
                    req.usuario
                );
            }

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
     * Obtener comentarios de una solicitud
     */
    static async obtenerComentariosSolicitud(req, res) {
        try {
            const { solicitud_id } = req.params;
            const { tipo, limit = 50, offset = 0 } = req.query;
            const usuario_id = req.usuario.id;
            const usuario_rol = req.usuario.rol;

            console.log(`. Obteniendo comentarios para solicitud: ${solicitud_id}`);

            // Verificar permisos
            const tienePermisos = await ComentariosModel.verificarPermisosSolicitud(
                solicitud_id, usuario_id, usuario_rol
            );

            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver los comentarios de esta solicitud'
                });
            }

            // Obtener comentarios usando el modelo
            const comentarios = await ComentariosModel.obtenerPorSolicitud(solicitud_id, {
                tipo,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            // Marcar como leídos si hay comentarios
            if (comentarios.length > 0) {
                await ComentariosModel.marcarComoLeidos(solicitud_id, usuario_id);
            }

            console.log(`. Comentarios obtenidos: ${comentarios.length}`);

            res.json({
                success: true,
                data: comentarios,
                total: comentarios.length
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
     * Obtener contador de comentarios no leídos
     */
    static async obtenerContadorNoLeidos(req, res) {
        try {
            const usuario_id = req.usuario.id;

            const count = await ComentariosModel.obtenerContadorNoLeidos(usuario_id);

            res.json({
                success: true,
                data: {
                    count
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
     * Eliminar comentario
     */
    static async eliminarComentario(req, res) {
        try {
            const { id } = req.params;
            const usuario_id = req.usuario.id;
            const usuario_rol = req.usuario.rol;

            console.log(`🗑️ Eliminando comentario: ${id}`);

            // Verificar permisos
            const tienePermisos = await ComentariosModel.verificarPermisos(
                id, usuario_id, usuario_rol
            );

            if (!tienePermisos) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este comentario'
                });
            }

            // Eliminar comentario usando el modelo
            await ComentariosModel.eliminar(id);

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

    /**
     * Obtener estadísticas de comentarios
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const usuario_id = req.usuario.id;
            const usuario_rol = req.usuario.rol;

            const estadisticas = await ComentariosModel.obtenerEstadisticas(usuario_id, usuario_rol);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('. Error en obtenerEstadisticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de comentarios'
            });
        }
    }

    /**
     * Buscar comentarios
     */
    static async buscarComentarios(req, res) {
        try {
            const { q: query, limit = 20 } = req.query;
            const usuario_id = req.usuario.id;
            const usuario_rol = req.usuario.rol;

            if (!query || query.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda es requerido'
                });
            }

            const resultados = await ComentariosModel.buscar(
                query.trim(), 
                usuario_id, 
                usuario_rol, 
                parseInt(limit)
            );

            res.json({
                success: true,
                data: resultados,
                total: resultados.length
            });

        } catch (error) {
            console.error('. Error en buscarComentarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar comentarios'
            });
        }
    }
}

module.exports = ComentariosController;