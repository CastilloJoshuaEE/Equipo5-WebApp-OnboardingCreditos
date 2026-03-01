// frontend/src/features/riesgo/bcra.types.ts
export interface EntidadBCRA {
  nombre: string;
  situacionDesc: string;
  monto: number;
  diasAtraso: number | null;
  refinanciaciones?: boolean;
  situacionJuridica?: boolean;
}

export interface DatosBCRAProcesados {
  encontrado: boolean;
  denominacion?: string;
  totalDeudas?: number;
  montoTotal?: number;
  situacionPromedio?: string;
  entidades?: EntidadBCRA[];
  periodo?: string;
  mensaje?: string;
}

export interface InfoBCRA {
  denominacion?: string;
  totalDeudas?: number;
  montoTotal?: number;
  situacionPromedio?: string;
  entidades?: EntidadBCRA[];

  error?: boolean;
  mensaje?: string;
  success?: boolean;

  procesado?: DatosBCRAProcesados;
  data?: DatosBCRAProcesados;

  consulta?: string;
  sinSSL?: boolean;
}
export interface BCRAStepProps {
    infoBCRA:  InfoBCRA | null;
}