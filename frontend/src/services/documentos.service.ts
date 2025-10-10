// frontend/src/services/documentos.service.ts
import api from '../lib/axios';

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

export const DocumentosService = {
  // Subir documento
  subirDocumento: async (solicitudId: string, tipo: string, archivo: File) => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('solicitud_id', solicitudId);
    formData.append('tipo', tipo);

    const response = await api.post(`/solicitudes/${solicitudId}/documentos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Obtener documentos de una solicitud
  obtenerDocumentosSolicitud: async (solicitudId: string): Promise<Documento[]> => {
    const response = await api.get(`/solicitudes/${solicitudId}/documentos`);
    return response.data.data;
  },

  // Descargar documento
  descargarDocumento: async (documentoId: string): Promise<Blob> => {
    const response = await api.get(`/documentos/${documentoId}/descargar`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Validar documento (para operadores)
  validarDocumento: async (documentoId: string, estado: string, comentarios?: string) => {
    const response = await api.put(`/documentos/${documentoId}/validar`, {
      estado,
      comentarios,
    });
    return response.data;
  },
};