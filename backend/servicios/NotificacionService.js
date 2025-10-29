// servicios/NotificacionService.js
const { supabase } = require('../config/conexion');
const { supabaseAdmin } = require('../config/supabaseAdmin');

class NotificacionService {
  /**
   * Crear notificación
   */
  static async crearNotificacion(usuarioId, tipo, titulo, mensaje, datosAdicionales = {}) {
    try {
      const notificacionData = {
        usuario_id: usuarioId,
        tipo,
        titulo,
        mensaje,
        datos_adicionales: datosAdicionales,
        leida: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('notificaciones')
        .insert([notificacionData])
        .select()
        .single();

      if (error) {
        console.error('Error creando notificación:', error);
        return { success: false, error: error.message };
      }

      console.log('. Notificación creada:', { usuarioId, tipo, titulo });
      return { success: true, data };

    } catch (error) {
      console.error('Error en crearNotificacion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear notificación con solicitud_id
   */
  static async crearNotificacionConSolicitud(usuarioId, solicitudId, tipo, titulo, mensaje, datosAdicionales = {}) {
    try {
      const notificacionData = {
        usuario_id: usuarioId,
        solicitud_id: solicitudId,
        tipo,
        titulo,
        mensaje,
        datos_adicionales: datosAdicionales,
        leida: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('notificaciones')
        .insert([notificacionData])
        .select()
        .single();

      if (error) {
        console.error('Error creando notificación con solicitud:', error);
        return { success: false, error: error.message };
      }

      console.log('. Notificación con solicitud creada:', { usuarioId, solicitudId, tipo });
      return { success: true, data };

    } catch (error) {
      console.error('Error en crearNotificacionConSolicitud:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notificar aprobación de solicitud
   */
  static async notificarAprobacionSolicitud(solicitudId, solicitanteId, operadorId) {
    try {
      // Notificar al solicitante
      await this.crearNotificacionConSolicitud(
        solicitanteId,
        solicitudId,
        'solicitud_aprobada',
        '¡Solicitud Aprobada!',
        'Tu solicitud de crédito ha sido aprobada. El proceso de firma digital se iniciará automáticamente.',
        { tipo: 'aprobacion', siguiente_paso: 'firma_digital' }
      );

      // Notificar al operador
      await this.crearNotificacionConSolicitud(
        operadorId,
        solicitudId,
        'solicitud_aprobada_operador',
        'Solicitud Aprobada - Proceso Iniciado',
        'Has aprobado la solicidad. El proceso de firma digital se iniciará automáticamente.',
        { tipo: 'confirmacion_aprobacion' }
      );

      return { success: true };
    } catch (error) {
      console.error('Error notificando aprobación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notificar error en firma digital automática
   */
static async notificarErrorFirmaDigital(operadorId, solicitudId, errorMessage) {
  try {
    return await this.crearNotificacionConSolicitud(
      operadorId,
      solicitudId,
      'error_firma_digital_automatica',
      'Error en Firma Digital Automática',
      `No se pudo iniciar automáticamente el proceso de firma digital para la solicitud ${solicitudId}: ${errorMessage}`,
      { 
        tipo: 'error',
        error: errorMessage,
        requiere_accion: true 
      }
    );
  } catch (error) {
    console.error('Error notificando error de firma digital:', error);
    return { success: false, error: error.message };
  }
}

  /**
   * Notificar cambio de estado de solicitud
   */
  static async notificarCambioEstado(solicitudId, usuarioId, estadoAnterior, estadoNuevo, comentarios = '') {
    try {
      const mensajes = {
        'en_revision': 'Tu solicitud está en revisión por un operador.',
        'pendiente_info': 'Se requiere información adicional para procesar tu solicitud.',
        'aprobado': '¡Felicidades! Tu solicitud ha sido aprobada.',
        'rechazado': 'Tu solicitud ha sido rechazada.',
        'firmado': 'El contrato ha sido firmado exitosamente.',
        'desembolsado': 'El crédito ha sido desembolsado.'
      };

      const titulo = `Estado Actualizado: ${estadoNuevo}`;
      const mensaje = mensajes[estadoNuevo] || `El estado de tu solicitud cambió a: ${estadoNuevo}`;

      if (comentarios) {
        mensaje += `\nComentarios: ${comentarios}`;
      }

      return await this.crearNotificacionConSolicitud(
        usuarioId,
        solicitudId,
        `cambio_estado_${estadoNuevo}`,
        titulo,
        mensaje,
        {
          estado_anterior: estadoAnterior,
          estado_nuevo: estadoNuevo,
          comentarios: comentarios
        }
      );
    } catch (error) {
      console.error('Error notificando cambio de estado:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notificar vencimiento de plazo
   */
  static async notificarVencimientoPlazo(usuarioId, solicitudId, tipoPlazo, diasRestantes = 0) {
    try {
      const mensaje = diasRestantes > 0 
        ? `Tienes ${diasRestantes} día(s) restante(s) para completar este proceso.`
        : 'El plazo para completar este proceso ha vencido.';

      return await this.crearNotificacionConSolicitud(
        usuarioId,
        solicitudId,
        `vencimiento_${tipoPlazo}`,
        `Plazo ${diasRestantes > 0 ? 'por Vencer' : 'Vencido'}`,
        mensaje,
        {
          tipo_plazo: tipoPlazo,
          dias_restantes: diasRestantes,
          urgente: diasRestantes <= 2
        }
      );
    } catch (error) {
      console.error('Error notificando vencimiento:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = NotificacionService;