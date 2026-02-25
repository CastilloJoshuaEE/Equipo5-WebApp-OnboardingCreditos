// frontend/src/features/contratos/contrato.types.ts
import { FirmaDigitalData } from "../firma_digital/firmaDigital.types";
import { DocumentoContrato } from "@/services/documentos/documento.types";
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
  created_at?: string;
  updated_at?: string;
}
export interface DocumentosContratoProps {
  solicitudId: string;
}
export type ContratoDocumento = {
  id: string;
  numero_contrato?: string;
  estado?: string;
  created_at?: string;
  monto_aprobado?: number;

  solicitud_numero?: string;
  monto_solicitud?: number;
  moneda_solicitud?: string;

  firma_digital?: FirmaDigitalData | null;
  firmas_digitales?: FirmaDigitalData[];
};
export type SolicitudConDocumentos = {
  numero_solicitud?: string;
  monto?: number;
  moneda?: string;
  contratos?: ContratoDocumento | ContratoDocumento[];
};
export type DocumentosContratoState = {
  contrato: DocumentoContrato;
  firma: DocumentoContrato['firma'];
};
 
export type DatosContrato = {
  nombre_completo?: string;
  dni?: string;
  domicilio?: string;
  nombre_empresa?: string;
  cuit?: string;
  representante_legal?: string;
  email?: string;
  numero_solicitud?: string;
};
export type ProcesarDocumentoBase64 = (
  documentoBase64: string,
  datos: DatosContrato
) => void;