// frontend/src/features/riesgo/scoring.types.ts
export interface Scoring {
  total: number;
  desglose: Record<string, ScoringCategoria>;
  documentosFaltantes: string[];
  documentosValidados: number;
  documentosPendientes: number;
}
export interface ScoringCategoria {
  puntaje: number;
  estado: string;
  documento_id?: string;
  nombre_archivo?: string;
}

export interface ScoringStepProps {
    scoring: Scoring;
}
export interface ScoringDocumentos {
  total: number;
  documentosValidados: number;
  documentosPendientes: number;
  documentosFaltantes: string[];
}