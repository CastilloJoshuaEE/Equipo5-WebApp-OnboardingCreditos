// frontend/src/hooks/useNotificaciones.ts (Actualizado)
import { useEffect, useState } from 'react';
import { Notificacion } from '@/services/notificaciones.service';
import notificacionesService from '@/services/notificaciones.service';

export function useNotificaciones() {
  const [contadorNoLeidas, setContadorNoLeidas] = useState(0);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarContador();
    
    const intervalo = setInterval(cargarContador, 30000);
    
    return () => clearInterval(intervalo);
  }, []);

  const cargarContador = async () => {
    try {
      const response = await notificacionesService.obtenerContadorNoLeidas();
      if (response.success) {
        setContadorNoLeidas(response.data.count);
        setError(null);
      } else {
        setError('Error al cargar contador');
      }
    } catch (error) {
      console.error('Error cargando contador:', error);
      setError('Error de conexión');
    }
  };

  const cargarNotificaciones = async (limit?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificacionesService.obtenerNotificaciones(limit);
      
      if (response.success) {
        setNotificaciones(response.data);
        setContadorNoLeidas(response.noLeidas);
        return response.data;
      } else {
        setError('Error al cargar notificaciones');
        return [];
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      setError('Error de conexión');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (id: string) => {
    try {
      await notificacionesService.marcarComoLeida(id);
      setNotificaciones(prev => 
        prev.filter(notif => notif.id !== id)
      );
      setContadorNoLeidas(prev => Math.max(0, prev - 1));
      setError(null);
    } catch (error) {
      console.error('Error marcando notificación:', error);
      setError('Error al marcar como leída');
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      await notificacionesService.marcarTodasComoLeidas();
      setNotificaciones([]);
      setContadorNoLeidas(0);
      setError(null);
    } catch (error) {
      console.error('Error marcando todas:', error);
      setError('Error al marcar todas como leídas');
    }
  };

  return {
    contadorNoLeidas,
    notificaciones,
    loading,
    error,
    cargarNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    recargarContador: cargarContador
  };
}