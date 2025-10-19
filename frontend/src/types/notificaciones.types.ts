export interface Notificacion {
  id: string;
  usuario_id: string;
  solicitud_id?: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  datos_adicionales?: {
    solicitud_numero?: string;
    monto?: number;
    estado_anterior?: string;
    estado_nuevo?: string;
  };
}

export interface NotificacionesState {
  notificaciones: Notificacion[];
  noLeidas: number;
  loading: boolean;
  modalAbierto: boolean;
}