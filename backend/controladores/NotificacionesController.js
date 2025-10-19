const NotificacionModel = require('../modelos/NotificacionModel');

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
}

module.exports = NotificacionesController;