// frontend/src/features/operador/contratoOperador.types.ts
import { FirmaDigital } from "../firma_digital/firmaDigital.types";
export interface ContratoOperador {
  id: string;
  tipo: string;
  numero_contrato: string;
  estado: string;
  ruta_documento: string;
  monto: number;
  moneda: string;
  created_at: string;
  updated_at: string;
  numero_solicitud: string;
  solicitante_nombre: string;
  firma_digital?: FirmaDigital;
  tiene_documento_firmado?: boolean;
  url_documento_firmado?: string;
  firma_id?: string;
}
