// frontend/src/features/operador/transferenciaOperador.types.ts
export interface TransferenciaOperador {
  id: string;
  tipo: string;
  numero_comprobante: string;
  estado: string;
  ruta_comprobante: string | null;
  monto: number;
  moneda: string;
  fecha_procesamiento: string;
  fecha_completada: string;
  banco_destino: string;
  cuenta_destino: string;
  numero_solicitud: string;
  solicitante_nombre: string;
  contacto_bancario?: string | null;
}
export type TransferenciaAPI = {
  id: string;
  numero_comprobante?: string;
  solicitante_nombre?: string;
  numero_solicitud?: string;
  estado?: string;
  ruta_comprobante?: string | null;
  banco_destino?: string;
  monto?: number;
  moneda?: string;
  fecha_procesamiento?: string;
  fecha_completada?: string; 
  cuenta_destino?: string; 
};
