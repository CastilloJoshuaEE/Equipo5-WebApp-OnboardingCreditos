// frontend/src/features/operador/transferenciaOperador.types.ts
export interface TransferenciaOperador {
  id: string;
  tipo: string;
  numero_comprobante: string;
  estado: string;
  ruta_comprobante: string;
  monto: number;
  moneda: string;
  fecha_procesamiento: string;
  fecha_completada: string;
  banco_destino: string;
  cuenta_destino: string;
  numero_solicitud: string;
  solicitante_nombre: string;
  contacto_bancario?: any;
}
