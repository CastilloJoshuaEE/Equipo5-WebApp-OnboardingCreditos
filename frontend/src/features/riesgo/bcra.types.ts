// frontend/src/features/riesgo/bcra.types.ts
export interface InfoBCRA {
  denominacion: string;
  totalDeudas: number;
  montoTotal: number;
  situacionPromedio: string;
  entidades: Array<{
    nombre: string;
    situacionDesc: string;
    monto: number;
    diasAtraso: number | null;
  }>;
  error?: boolean;
  mensaje?: string;
  success?: boolean;
  procesado?: any;
  consulta?: string;
  sinSSL?: boolean;
}
export interface BCRAStepProps {
    infoBCRA: any;
}