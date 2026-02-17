// frontend/src/features/contratos/contrato.types.ts

export interface Contrato {
  id: string;
  solicitud_id: string;
  numero_contrato: string;
  monto_aprobado: number;
  tasa_interes: number;
  plazo_meses: number;
  estado: 'generado' | 'firmado_solicitante' | 'firmado_completo' | 'vigente' | 'cerrado';
  ruta_documento?: string;
  firma_digital_id?: string;
  hash_contrato?: string;
  fecha_firma_solicitante?: string;
  fecha_firma_entidad?: string;
  fecha_firma_completa?: string;
  created_at: string;
  updated_at: string;
}
export interface DocumentosContratoProps {
  solicitudId: string;
}