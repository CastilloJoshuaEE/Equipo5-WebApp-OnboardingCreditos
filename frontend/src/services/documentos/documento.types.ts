// frontend/src/services/documentos/documento.types.ts
export interface Documento {
  id: string;
  solicitud_id: string;
  tipo: string;
  nombre_archivo: string;
  ruta_storage: string;
  estado: string;
  created_at: string;
  validado_en?: string;
  comentarios?: string;
}

export interface DocumentoContrato {
  id: string;
  numero_contrato: string;
  estado: string;
  ruta_documento: string;
  fecha_creacion: string;
  firma?: {
    id: string;
    estado: string;
    fecha_firma_completa: string;
    url_documento_firmado: string;
    ruta_documento: string;
  } | null;
}

export interface ComprobanteTransferencia {
  id: string;
  numero_comprobante: string;
  monto: number;
  moneda: string;
  estado: string;
  fecha_procesamiento: string;
  ruta_comprobante: string;
  contacto_bancario: {
    nombre_banco: string;
    numero_cuenta: string;
    tipo_cuenta: string;
  };
}

export interface VistaPreviaDocumento {
  url: string;
  nombre: string;
  tipo: 'contrato' | 'comprobante';
}