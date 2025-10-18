import api from '../lib/axios';
import { SolicitudOperador, RevisionData, FiltrosOperador } from '../types/operador';

export const OperadorService = {
    // Obtener dashboard con filtros
    obtenerDashboard: async (filtros: FiltrosOperador): Promise<{ solicitudes: SolicitudOperador[] }> => {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        const response = await api.get(`/operador/dashboard?${params}`);
        return response.data.data;
    },

    // Iniciar revisión de solicitud
    iniciarRevision: async (solicitudId: string): Promise<RevisionData> => {
        const response = await api.get(`/operador/solicitudes/${solicitudId}/revision`);
        return response.data.data;
    },

    // Tomar decisión sobre solicitud
    tomarDecision: async (solicitudId: string, decision: string, observaciones: string) => {
        const response = await api.post(`/operador/solicitudes/${solicitudId}/decision`, {
            decision,
            observaciones
        });
        return response.data;
    },

    // Solicitar información adicional
    solicitarInformacion: async (solicitudId: string, observaciones: string) => {
        const response = await api.post(`/operador/solicitudes/${solicitudId}/solicitar-info`, {
            observaciones
        });
        return response.data;
    },

    // Validar documento
    validarDocumento: async (documentoId: string, estado: string, comentarios?: string) => {
        const response = await api.put(`/operador/documentos/${documentoId}/validar`, {
            estado,
            comentarios
        });
        return response.data;
    },

    // Descargar documento
    descargarDocumento: async (documentoId: string): Promise<Blob> => {
        const response = await api.get(`/operador/documentos/${documentoId}/descargar`, {
            responseType: 'blob'
        });
        return response.data;
    }
};