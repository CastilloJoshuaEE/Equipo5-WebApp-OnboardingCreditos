// frontend/src/services/notificaciones.service.ts (Actualizado)
import api from '@/lib/axios';

export interface Notificacion {
  id: string;
  usuario_id: string;
  solicitud_id?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  datos_adicionales?: any;
}

export interface NotificacionesResponse {
  success: boolean;
  data: Notificacion[];
  total: number;
  noLeidas: number;
}

class NotificacionesService {
  async obtenerNotificaciones(limit: number = 10, offset: number = 0): Promise<NotificacionesResponse> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      
      const response = await api.get(`/notificaciones?${params}`);
      
      // Debug: log de respuesta
      console.log('Notificaciones response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error en obtenerNotificaciones:', error);
      throw error;
    }
  }

  async obtenerNoLeidas(): Promise<NotificacionesResponse> {
    try {
      const response = await api.get('/notificaciones?leida=false&limit=5');
      console.log('Notificaciones no leídas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en obtenerNoLeidas:', error);
      throw error;
    }
  }

  async marcarComoLeida(id: string): Promise<{ success: boolean }> {
    try {
      const response = await api.put(`/notificaciones/${id}/leer`);
      return response.data;
    } catch (error) {
      console.error('Error en marcarComoLeida:', error);
      throw error;
    }
  }

  async marcarTodasComoLeidas(): Promise<{ success: boolean }> {
    try {
      const response = await api.put('/notificaciones/leer-todas');
      return response.data;
    } catch (error) {
      console.error('Error en marcarTodasComoLeidas:', error);
      throw error;
    }
  }

  async obtenerContadorNoLeidas(): Promise<{ success: boolean; data: { count: number } }> {
    try {
      const response = await api.get('/notificaciones/contador-no-leidas');
      console.log('Contador no leídas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en obtenerContadorNoLeidas:', error);
      throw error;
    }
  }
}

export default new NotificacionesService();