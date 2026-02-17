// frontend/src/components/ui/decisionStepProps.tsx
import { SolicitudOperador } from "@/features/solicitudes/solicitud.types";
export interface DecisionStepProps {
    solicitud: any;
    onClose: () => void;
    onComentarioEnviado?: (comentario: string) => void;
    onDecisionTomada?: (decision: string, motivo?: string) => void;
    onDashboardActualizado?: () => void;
    loading?: boolean;
}
export interface ResumenStepProps {
    solicitud: SolicitudOperador;
}
