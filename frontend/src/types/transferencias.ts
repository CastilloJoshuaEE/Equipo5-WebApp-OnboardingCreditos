export interface HabilitacionTransferencia {
  habilitado: boolean;
  motivo?: string;
  fecha_firma_completa?: string;
  transferencia_existente?: any;
  tiene_firma_solicitante?: boolean;
  tiene_firma_operador?: boolean;
}

export interface ContactoBancario {
  id: string;
  numero_cuenta: string;
  nombre_banco: string;
  tipo_cuenta: string;
  moneda: string;
  email_contacto?: string;
  telefono_contacto?: string;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}