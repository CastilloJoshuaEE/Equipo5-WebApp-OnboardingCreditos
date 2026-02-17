// frontend/src/services/documentos/documento.service.ts
import api from '@/lib/axios';
import {Documento} from '@/services/documentos/documento.types';
import {DocumentoContrato } from '@/services/documentos/documento.types';
import {ComprobanteTransferencia  } from '@/services/documentos/documento.types';
import {VistaPreviaDocumento   } from '@/services/documentos/documento.types';

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
      /**
     * Obtener mis solicitudes con documentos disponibles
     */
    async obtenerMisSolicitudesConDocumentos() {
        const response = await api.get('/solicitudes/mis-solicitudes-con-documentos');
        return response.data.data;
    },
    async obtenerDocumentosStorage(solicitudId: string) {
    const response = await api.get(`/solicitudes/${solicitudId}/documentos-storage`);
    return response.data.data;
},
};
