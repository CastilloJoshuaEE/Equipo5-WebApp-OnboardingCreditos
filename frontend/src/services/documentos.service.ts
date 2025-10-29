import api from '@/lib/axios';

// --- Tipos base ---
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

export const DocumentosService = {
  // Subir documento
  async subirDocumento(solicitudId: string, tipo: string, archivo: File) {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('solicitud_id', solicitudId);
    formData.append('tipo', tipo);

    const response = await api.post(`/solicitudes/${solicitudId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Obtener todos los documentos asociados a una solicitud
  async obtenerDocumentosSolicitud(solicitudId: string): Promise<Documento[]> {
    const response = await api.get(`/solicitudes/${solicitudId}/documentos`);
    return response.data.data;
  },

  // Descargar documento genérico
  async descargarDocumento(documentoId: string): Promise<Blob> {
    const response = await api.get(`/documentos/${documentoId}/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Validar documento (operador)
  async validarDocumento(documentoId: string, estado: string, comentarios?: string) {
    const response = await api.put(`/documentos/${documentoId}/validar`, {
      estado,
      comentarios,
    });
    return response.data;
  },

  // Evaluar documento con criterios específicos
  async evaluarDocumento(documentoId: string, criterios: any, comentarios: string) {
    const response = await api.post(`/documentos/${documentoId}/evaluar`, {
      criterios,
      comentarios,
    });
    return response.data;
  },

  // Obtener criterios de evaluación por tipo de documento
  async obtenerCriteriosEvaluacion(tipoDocumento: string) {
    const response = await api.get(`/documentos/criterios-evaluacion/${tipoDocumento}`);
    return response.data;
  },

  //  Obtener historial de evaluaciones de un documento
  async obtenerHistorialEvaluaciones(documentoId: string) {
    const response = await api.get(`/documentos/${documentoId}/historial-evaluaciones`);
    return response.data.data;
  },


  //  Obtener documentos de contrato asociados a una solicitud
  async obtenerDocumentosContrato(solicitudId: string): Promise<{ contrato: DocumentoContrato; firma: any }> {
    const response = await api.get(`/solicitudes/${solicitudId}/contrato/documentos`);
    return response.data.data;
  },

  //  Obtener comprobantes de transferencia asociados a una solicitud
  async obtenerComprobantesTransferencia(solicitudId: string): Promise<ComprobanteTransferencia[]> {
    const response = await api.get(`/solicitudes/${solicitudId}/comprobantes`);
    return response.data.data;
  },

  //  Descargar contrato específico
  async descargarContrato(contratoId: string): Promise<Blob> {
    const response = await api.get(`/contratos/${contratoId}/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  },

  //  Descargar comprobante de transferencia
  async descargarComprobante(transferenciaId: string): Promise<Blob> {
    const response = await api.get(`/transferencias/${transferenciaId}/comprobante/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Obtener vista previa de contrato o comprobante
  async obtenerVistaPrevia(tipo: 'contrato' | 'comprobante', id: string): Promise<VistaPreviaDocumento> {
    const response = await api.get(`/documentos/${tipo}/${id}/ver`);
    return response.data.data;
  },

  //  Verificar permisos de acceso a documentos
  async verificarPermisosDocumento(solicitudId: string): Promise<boolean> {
    try {
      await api.get(`/solicitudes/${solicitudId}/contrato/documentos`);
      return true;
    } catch {
      return false;
    }
  },
};
