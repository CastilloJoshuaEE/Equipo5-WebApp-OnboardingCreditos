// frontend/src/features/riesgo/scoring.types.ts
export interface Scoring {
  total: number;
  desglose: {
    [key: string]: {
      puntaje: number;
      estado: string;
      documento_id?: string;
      nombre_archivo?: string;
    };
  };
  documentosFaltantes: string[];
  documentosValidados: number;
  documentosPendientes: number;
}
export interface ScoringStepProps {
    scoring: any;
}
