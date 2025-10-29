const NotificacionModel = require('../modelos/NotificacionModel');
const { supabase } = require('../config/conexion');

class NotificacionesController {
  // Obtener notificaciones del usuario
  static async obtenerNotificaciones(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { limit = 10, offset = 0, leida } = req.query;

      const filtros = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        leida: leida === 'true' ? true : leida === 'false' ? false : undefined
      };

      const notificaciones = await NotificacionModel.obtenerPorUsuario(usuarioId, filtros);
      const total = await NotificacionModel.obtenerContador(usuarioId);
      const noLeidas = await NotificacionModel.obtenerContador(usuarioId, false);

      res.json({
        success: true,
        data: notificaciones,
        total,
        noLeidas
      });

    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones'
      });
    }
  }

  // Obtener contador de notificaciones no leídas
  static async obtenerContadorNoLeidas(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const count = await NotificacionModel.obtenerContador(usuarioId, false);

      res.json({
        success: true,
        data: { count }
      });

    } catch (error) {
      console.error('Error obteniendo contador:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener contador de notificaciones'
      });
    }
  }

  // Marcar notificación como leída
   static async marcarComoLeida(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;

      // Verificar propiedad
      const esPropietario = await NotificacionModel.verificarPropiedad(id, usuarioId);
      if (!esPropietario) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para esta notificación'
        });
      }

      await NotificacionModel.marcarComoLeida(id, usuarioId);

      res.json({
        success: true,
        message: 'Notificación marcada como leída'
      });

    } catch (error) {
      console.error('Error marcando notificación:', error);
      if (error.message.includes('No se pudo encontrar')) {
        return res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error al marcar notificación como leída'
      });
    }
  }

  // Marcar todas las notificaciones como leídas
  static async marcarTodasComoLeidas(req, res) {
    try {
      const usuarioId = req.usuario.id;
      await NotificacionModel.marcarTodasComoLeidas(usuarioId);

      res.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas'
      });

    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al marcar notificaciones como leídas'
      });
    }
  }
  /**
 * Crear notificación específica para firma del solicitante
 */
static async crearNotificacionFirmaSolicitante(solicitanteId, solicitudId, firmaId) {
    try {
        const notificacionData = {
            usuario_id: solicitanteId,
            solicitud_id: solicitudId,
            tipo: 'firma_digital_solicitante',
            titulo: 'Solicitud de Firma Digital - Contrato de Crédito',
            mensaje: 'Se ha enviado una solicitud de firma digital para tu contrato de crédito aprobado. Por favor, revisa y firma el documento.',
            datos_adicionales: {
                url_firma: `/firmar-contrato/${firmaId}`,
                tipo_firma: 'digital',
                firma_id: firmaId
            },
            leida: false,
            created_at: new Date().toISOString()
        };

        const { error: notifError } = await supabase
            .from('notificaciones')
            .insert([notificacionData]);

        if (notifError) {
            console.error('Error creando notificación de firma para solicitante:', notifError);
        } else {
            console.log('. Notificación de firma enviada al solicitante:', solicitanteId);
        }
    } catch (error) {
        console.error('Error en crearNotificacionFirmaSolicitante:', error);
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
       * Crear notificaciones para ambos firmantes
       */
      static async crearNotificacionesFirma(solicitanteId, operadorId, solicitudId, firma) {
          try {
              const notificaciones = [];
  
              // Notificación para solicitante
              notificaciones.push({
                  usuario_id: solicitanteId,
                  solicitud_id: solicitudId,
                  tipo: 'firma_digital_solicitante',
                  titulo: 'Solicitud de Firma Digital - Contrato de Crédito',
                  mensaje: 'Se ha enviado una solicitud de firma digital para tu contrato de crédito aprobado. Por favor, revisa y firma el documento.',
                  datos_adicionales: {
                      url_firma: firma.url_firma_solicitante,
                      tipo_firma: 'digital',
                      expira_en: firma.fecha_expiracion,
                      firma_id: firma.id
                  },
                  leida: false,
                  created_at: new Date().toISOString()
              });
  
              // Notificación para operador
              notificaciones.push({
                  usuario_id: operadorId,
                  solicitud_id: solicitudId,
                  tipo: 'firma_digital_operador',
                  titulo: 'Proceso de Firma Digital Iniciado',
                  mensaje: 'Se ha iniciado el proceso de firma digital para el contrato. El solicitante debe firmar primero.',
                  datos_adicionales: {
                      url_firma: firma.url_firma_operador,
                      tipo_firma: 'digital',
                      expira_en: firma.fecha_expiracion,
                      firma_id: firma.id
                  },
                  leida: false,
                  created_at: new Date().toISOString()
              });
  
              await supabase
                  .from('notificaciones')
                  .insert(notificaciones);
  
              console.log('. Notificaciones de firma creadas para ambos firmantes');
          } catch (error) {
              console.error('Error creando notificaciones de firma:', error);
          }
      }
     /**
     * Notificar firma del solicitante completada
     */
    static async notificarFirmaSolicitanteCompletada(contratoId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        operador_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                await supabase
                    .from('notificaciones')
                    .insert({
                        usuario_id: contrato.solicitudes_credito.operador_id,
                        tipo: 'firma_solicitante_completada',
                        titulo: 'Solicitante Ha Firmado el Contrato',
                        mensaje: 'El solicitante ha completado la firma digital del contrato. Ahora es tu turno de firmar.',
                        leida: false,
                        created_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error notificando firma del solicitante:', error);
        }
    }

    /**
     * Notificar firma del operador completada
     */
    static async notificarFirmaOperadorCompletada(contratoId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                await supabase
                    .from('notificaciones')
                    .insert({
                        usuario_id: contrato.solicitudes_credito.solicitante_id,
                        tipo: 'firma_operador_completada',
                        titulo: 'Operador Ha Firmado el Contrato',
                        mensaje: 'El operador ha completado su firma digital. El proceso de firma está casi completo.',
                        leida: false,
                        created_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error notificando firma del operador:', error);
        }
    }

    /**
     * Notificar firma completada
     */
    static async notificarFirmaCompletada(contratoId, solicitudId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                const solicitud = contrato.solicitudes_credito;
                const notificaciones = [];

                // Notificar al operador
                notificaciones.push({
                    usuario_id: solicitud.operador_id,
                    solicitud_id: solicitudId,
                    tipo: 'firma_completada_operador',
                    titulo: 'Firma Digital Completada',
                    mensaje: 'El proceso de firma digital del contrato se ha completado exitosamente. El crédito está listo para desembolso.',
                    leida: false,
                    created_at: new Date().toISOString()
                });

                // Notificar al solicitante
                notificaciones.push({
                    usuario_id: solicitud.solicitante_id,
                    solicitud_id: solicitudId,
                    tipo: 'firma_completada_solicitante',
                    titulo: 'Firma Digital Completada',
                    mensaje: '¡Felicidades! Has completado exitosamente la firma digital del contrato. Tu crédito será desembolsado pronto.',
                    leida: false,
                    created_at: new Date().toISOString()
                });

                await supabase
                    .from('notificaciones')
                    .insert(notificaciones);

                console.log('. Notificaciones de firma completada enviadas');
            }
        } catch (error) {
            console.error('Error notificando firma completada:', error);
        }
    }

    /**
     * Notificar rechazo de firma
     */
    static async notificarRechazoFirma(contratoId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                const solicitud = contrato.solicitudes_credito;

                // Notificar al operador
                await supabase
                    .from('notificaciones')
                    .insert({
                        usuario_id: solicitud.operador_id,
                        tipo: 'firma_rechazada',
                        titulo: 'Firma Digital Rechazada',
                        mensaje: 'El solicitante ha rechazado la firma digital del contrato.',
                        leida: false,
                        created_at: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error('Error notificando rechazo de firma:', error);
        }
    }

    /**
     * Notificar expiración de firma
     */
    static async notificarExpiracionFirma(contratoId) {
        try {
            const { data: contrato } = await supabase
                .from('contratos')
                .select(`
                    *,
                    solicitudes_credito(
                        solicitante_id,
                        operador_id
                    )
                `)
                .eq('id', contratoId)
                .single();

            if (contrato && contrato.solicitudes_credito) {
                const solicitud = contrato.solicitudes_credito;
                const notificaciones = [];

                // Notificar al operador
                notificaciones.push({
                    usuario_id: solicitud.operador_id,
                    tipo: 'firma_expirada_operador',
                    titulo: 'Firma Digital Expirada',
                    mensaje: 'El proceso de firma digital ha expirado. Se requiere acción del operador.',
                    leida: false,
                    created_at: new Date().toISOString()
                });

                // Notificar al solicitante
                notificaciones.push({
                    usuario_id: solicitud.solicitante_id,
                    tipo: 'firma_expirada_solicitante',
                    titulo: 'Firma Digital Expirada',
                    mensaje: 'El tiempo para firmar el contrato ha expirado. Por favor, contacta al operador.',
                    leida: false,
                    created_at: new Date().toISOString()
                });

                await supabase
                    .from('notificaciones')
                    .insert(notificaciones);
            }
        } catch (error) {
            console.error('Error notificando expiración de firma:', error);
        }
    }

}

module.exports = NotificacionesController;