// frontend/src/services/comentarios.service.ts
import api from '../lib/axios';

export interface Comentario {
    id: string;
    solicitud_id: string;
    usuario_id: string;
    tipo: string;
    comentario: string;
    leido: boolean;
    created_at: string;
    usuarios: {
        nombre_completo: string;
        email: string;
        rol: string;
    };
}

export const ComentariosService = {
    // Crear comentario
    crearComentario: async (solicitudId: string, comentario: string, tipo: string = 'operador_a_solicitante') => {
        const response = await api.post('/comentarios', {
            solicitud_id: solicitudId,
            comentario,
            tipo
        });
        return response.data;
    },

    // Obtener comentarios de una solicitud
    obtenerComentariosSolicitud: async (solicitudId: string, tipo?: string): Promise<Comentario[]> => {
        const params: any = {};
        if (tipo) params.tipo = tipo;
        
        const response = await api.get(`/solicitudes/${solicitudId}/comentarios`, { params });
        return response.data.data;
    },

    // Obtener contador de comentarios no leídos
    obtenerContadorNoLeidos: async (): Promise<{ count: number }> => {
        const response = await api.get('/comentarios/contador-no-leidos');
        return response.data.data;
    },

    // Eliminar comentario
    eliminarComentario: async (comentarioId: string) => {
        const response = await api.delete(`/comentarios/${comentarioId}`);
        return response.data;
    }
};