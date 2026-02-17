// frontend/src/features/operador/dashboard.types.ts
export interface MetricasDashboard {
  totalSolicitudes: number;
  aprobadas: number;
  enRevision: number;
  montoDesembolsado: number;
  listasParaTransferencia?: number;
}

export interface FiltrosOperador {
  estado?: string;
  nivel_riesgo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  numero_solicitud?: string;
  dni?: string;
}
