// frontend/src/features/documentos/documento.types.ts

export interface Documento {
  id: string;
  tipo: string;
  nombre_archivo: string;
  ruta_storage: string;
  tamanio_bytes: number;
  estado: string;
  created_at: string;
  validado_en?: string;
  comentarios?: string;
  informacion_extraida?: any;
}
export interface DocumentacionStepProps {
    documentos: Documento[];
    scoring: any;
    onValidarDocumento: (documentoId: string, estado: string, comentarios?: string) => void;
    onEvaluarDocumento?: (documentoId: string, criterios: any, comentarios: string, estado?: string) => void;     onDescargarDocumento: (documento: Documento) => void;
    onVerDocumento: (documento: Documento) => void;
    loading?: boolean;
    solicitudId?: string;
}
export interface ComprobantesTransferenciaProps {
  solicitudId: string;
}
export interface DocumentoData {
  id: string;
  tipo: string;
  nombre_archivo: string;
  ruta_storage: string;
  tamanio_bytes: number;
  estado: string;
  created_at: string;
  validado_en?: string;
  comentarios?: string;
  informacion_extraida?: any;
  updated_at?: string;
}
export interface GestionDocumentosProps {
  solicitudId: string;
}
export interface Plantilla {
  id: number;
  tipo: string;
  nombre_archivo: string;
  ruta_storage: string;
  tamanio_bytes: number;
  created_at: string;
}
export interface DocumentoConTipo {
  file: File;
  tipo: string;
  id: string; // ID único para identificar el documento
}
