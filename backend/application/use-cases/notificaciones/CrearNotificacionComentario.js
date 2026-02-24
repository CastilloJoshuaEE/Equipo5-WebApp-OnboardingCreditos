// backend/application/use-cases/notificaciones/CrearNotificacionComentario.js
const Notificacion = require('../../../domain/entities/Notificacion');

class CrearNotificacionComentario {
  constructor(notificacionRepository) {
    this.notificacionRepository = notificacionRepository;
  }

  async execute(solicitud, comentario, usuarioOrigen) {
    let usuarioDestino = null;
    let titulo = '';
    let mensaje = '';

    if (comentario.tipo === 'operador_a_solicitante') {
      usuarioDestino = solicitud.solicitante_id;
      titulo = 'Nuevo comentario del operador';
      mensaje = `El operador ha enviado un comentario sobre tu solicitud: "${comentario.comentario.substring(0, 100)}..."`;
    } else if (comentario.tipo === 'solicitante_a_operador') {
      usuarioDestino = solicitud.operador_id;
      titulo = 'Nuevo comentario del solicitante';
      mensaje = `El solicitante ha respondido a tu comentario: "${comentario.comentario.substring(0, 100)}..."`;
    }

    if (usuarioDestino) {
      const notificacion = new Notificacion({
        usuario_id: usuarioDestino,
        solicitud_id: solicitud.id,
        tipo: Notificacion.TIPOS.NUEVO_COMENTARIO,
        titulo: titulo,
        mensaje: mensaje,
        leida: false,
        datos_adicionales: {
          comentario_id: comentario.id,
          tipo_comentario: comentario.tipo,
          usuario_origen: usuarioOrigen.nombre_completo,
          comentario_preview: comentario.comentario.substring(0, 100)
        }
      });

      const notificacionCreada = await this.notificacionRepository.crear(notificacion.toJSON());

      return {
        success: true,
        data: notificacionCreada
      };
    }

    return {
      success: false,
      message: 'No se pudo determinar el destinatario'
    };
  }
}

module.exports = CrearNotificacionComentario;