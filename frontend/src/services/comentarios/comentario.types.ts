// frontend/src/services/comentarios/comentario.types.ts
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
