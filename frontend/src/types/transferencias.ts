export interface HabilitacionTransferencia {
  habilitado: boolean;
  motivo?: string;
  fecha_firma_completa?: string;
  transferencia_existente?: any;
}

export interface ContactoBancario {
  id: string;
  numero_cuenta: string;
  nombre_banco: string;
  tipo_cuenta: string;
  moneda: string;
  solicitante_nombre: string;
  solicitante_dni: string;
}