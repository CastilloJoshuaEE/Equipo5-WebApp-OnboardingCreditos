// frontend/src/features/solicitudes/solicitud.types.ts
import { TransferenciaBancaria } from '@/features/transferencias/transferencia.types';
import { Contrato } from '@/features/contratos/contrato.types';

export interface SolicitudOperador {
  id: string;
  numero_solicitud: string;
  monto: number;
  plazo_meses: number;
  proposito?: string;
  moneda?: string;
  estado: string;
  nivel_riesgo: string;
  created_at: string;
  fecha_envio?: string;

  solicitantes: {
    nombre_empresa: string;
    cuit: string;
    representante_legal: string;
    domicilio?: string;
    usuarios: {
      nombre_completo: string;
      email: string;
      telefono: string;
      dni?: string;
    };
  };

  transferencias_bancarias?: TransferenciaBancaria[];
  contratos?: Contrato[];

  solicitante_info?: {
    nombre_empresa: string;
    cuit: string;
    representante_legal: string;
    domicilio: string;
    contacto: string;
    email: string;
    telefono: string;
    dni: string;
  };
}

export interface SolicitudInfo {
  id: string;
  numero_solicitud: string;
  monto: number;
  moneda: string;
  solicitante_id: string;
  estado: string;
}
export interface SolicitudDetalle {
  id: string;
  numero_solicitud: string;
  monto: number;
  plazo_meses: number;
  moneda: string;
  estado: string;
  nivel_riesgo: string;
  proposito: string;
  comentarios?: string;
  motivo_rechazo?: string;
  created_at: string;
  fecha_envio?: string;
  fecha_decision?: string;
  documentos: Array<{
    id: string;
    tipo: string;
    nombre_archivo: string;
    estado: string;
    created_at: string;
    validado_en?: string;
    comentarios?: string;
  }>;
}
export interface Solicitud {
  id: string;
  numero_solicitud: string;
  monto: number;
  plazo_meses: number;
  moneda: string;
  estado: string;
  nivel_riesgo?: string;
  created_at: string;
  fecha_envio?: string;
} 