// frontend/src/services/notificaciones/notificaciones.service.ts 
import api from '@/lib/axios';
import {NotificacionesResponse   } from '@/services/notificaciones/notificacion.types';
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