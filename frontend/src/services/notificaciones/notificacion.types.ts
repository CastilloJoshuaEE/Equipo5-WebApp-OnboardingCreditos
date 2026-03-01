// frontend/src/services/notificaciones/notificacion.types.ts
export interface DatosAdicionalesNotificacion {
  solicitud_numero?: string;
  monto?: number;
  estado_anterior?: string;
  estado_nuevo?: string;
}
export interface Notificacion {
  id: string;
  usuario_id: string;
  solicitud_id?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at?: string;
  datos_adicionales?: DatosAdicionalesNotificacion;
}

export interface NotificacionesResponse {
  success: boolean;
  data: Notificacion[];
  total: number;
  noLeidas: number;
}