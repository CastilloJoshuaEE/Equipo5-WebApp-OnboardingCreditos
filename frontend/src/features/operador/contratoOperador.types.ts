// frontend/src/features/operador/contratoOperador.types.ts
import { FirmaDigital } from "../firma_digital/firmaDigital.types";
export interface ContratoOperador {
  id: string;
  tipo: string;
  numero_contrato: string;
  estado: string;
  ruta_documento: string | null;
  monto: number;
  moneda: string;
  created_at: string | null;
  updated_at?: string;
  numero_solicitud: string;
  solicitante_nombre: string;
  firma_digital?: FirmaDigital;
  tiene_documento_firmado?: boolean;
  url_documento_firmado?: string  | null;
  firma_id?: string  | null;
}
export type ContratoAPI = {
  id: string;
  numero_contrato?: string;
  solicitante_nombre?: string;
  numero_solicitud?: string;
  estado?: string;
  ruta_documento?: string | null;
  monto?: number;
  moneda?: string;
  tiene_documento_firmado?: boolean;
  url_documento_firmado?: string | null;
  firma_id?: string | null;
  created_at?: string | null;
  updated_at?: string;
};
