// backend/application/use-cases/comentarios/CrearComentario.js
const Comentario = require('../../../domain/entities/Comentario');
class CrearComentario{
    constructor(comentarioRepository, notificacionService, supabase){
        this.comentarioRepository = comentarioRepository;
        this.notificacionService = notificacionService;
        this.supabase = supabase;
    }
    async execute({solicitud_id, comentario, tipo}, usuario){
        console.log(`Creando comentario para solicitud:${solicitud_id}`,{
            usuario_id: usuario.id,
            tipo,
            comentario: comentario.substring(0,100) + '...'
        });
        // Validaciones
        if(!solicitud_id || !comentario){
            return{
                success: false,
                status: 400,
                message: 'Solicitud ID y comentario son requeridos'
            };
        }
        // Verificar permisos sobre la solicitud
        const tienePermisos = await this.comentarioRepository.verificarPermisosSolicitud(
            solicitud_id,
            usuario.id,
            usuario.rol
        );
        if(!tienePermisos){
            return {
                success: false,
                status: 403,
                message: 'No tiene permisos para comentar en esta solicitud'
            };
        }
        try{
            // Crear entidad de comentario
            const comentarioEntity = new Comentario({
                solicitud_id,
                usuario_id: usuario.id,
                tipo: tipo || Comentario.TIPOS.OPERADOR_A_SOLICITANTE,
                comentario: comentario.trim(),
                leido: false
            });
            // Validar
            comentarioEntity.validarComentario();
            // Guardar en repositorio
            const nuevoComentario= await this.comentarioRepository.crear(comentarioEntity.toJSON());
            // Obtener información de la solicitud para la notificación
            const {data:solicitud} = await this.supabase
                .from('solicitudes_credito')
                .select('id, solicitante_id, operador_id, estado')
                .eq('id', solicitud_id)
                .single();
            // Crear notificación
            if(solicitud){
                await this._crearNotificacionComentario(solicitud, nuevoComentario, usuario);
            }
            console.log(`Comentario creado exitosamente: ${nuevoComentario.id}`);
            return{
                success: true,
                status: 201,
                message: 'Comentario enviado exitosamente',
                data: nuevoComentario
            };
        }
        catch(error){
            console.error('Error en CrearComentario:', error);
            return{
                success: false,
                status:500,
                message: 'Error al crear comentario:' + error.message
            };
        }
        
    }
    async _crearNotificacionComentario(solicitud, comentario, usuarioEmisor){
        try{
            let destinatarioId = null;
            let tipoNotificacion= '';
            if(comentario.tipo === Comentario.TIPOS.OPERADOR_A_SOLICITANTE){
                // Notificar al solicitante
                destinatarioId = solicitud.solicitante_id;
                tipoNotificacion = 'nuevo_comentario_operador';
            } else{
                // Notificar al operador
                destinatarioId = solicitud.operador_id;
                tipoNotificacion = 'nuevo_comentario_solicitante';
            }
            if(destinatarioId){
                await this.notificacionService.crearNotificacionComentario(
              destinatarioId,
          solicitud.id,
          tipoNotificacion,
          'Nuevo comentario en tu solicitud',
          comentario.comentario.substring(0, 100) + '...',
          {
            comentario_id: comentario.id,
            emisor: usuarioEmisor.nombre_completo,
            tipo: comentario.tipo
          }
        );
      }
    } catch (error) {
      console.warn('Error creando notificación de comentario:', error.message);
    }
  }
}

module.exports = CrearComentario;