// frontend/src/features/operador/revision.types.ts
import { SolicitudOperador } from '../solicitudes/solicitud.types';
import { Documento } from '../documentos/documento.types';
import { Scoring } from '../riesgo/scoring.types';
import { InfoBCRA } from '../riesgo/bcra.types';

export interface RevisionData {
  solicitud: SolicitudOperador;
  documentos: Documento[];
  infoBCRA: InfoBCRA;
  scoring: Scoring;
  solicitante: any;
}

export interface RevisionModalProps {
    open: boolean;
    onClose: () => void;
    data: RevisionData;
    onDocumentoActualizado?: () => void; // Nueva prop para refrescar datos
}