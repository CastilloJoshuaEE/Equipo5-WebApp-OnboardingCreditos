// frontend/src/features/transferencias/transferencias.types.ts
export interface TransferenciaBancaria {
  id: string;
  solicitud_id: string;
  contrato_id: string;
  contacto_bancario_id: string;
  monto: number;
  moneda: string;
  numero_comprobante?: string;
  cuenta_origen: string;
  banco_origen: string;
  cuenta_destino: string;
  banco_destino: string;
  motivo?: string;
  costo_transferencia: number;
  estado: 'pendiente' | 'procesando' | 'completada' | 'fallida' | 'reversada';
  procesado_por?: string;
  fecha_procesamiento?: string;
  fecha_completada?: string;
  ruta_comprobante?: string;
  created_at: string;
  updated_at: string;
}

export interface HabilitacionTransferencia {
  habilitado: boolean;
  motivo?: string;
  fecha_firma_completa?: string;
  transferencia_existente?: any;
  tiene_firma_solicitante?: boolean;
  tiene_firma_operador?: boolean;
}
export interface TransferenciaEstado {
  habilitado: boolean;
  existe_transferencia: boolean;
  transferencia_existente?: any;
  estado_firma?: string;
  motivo?: string;
}