// frontend/src/services/notificaciones/notificacion.types.ts

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