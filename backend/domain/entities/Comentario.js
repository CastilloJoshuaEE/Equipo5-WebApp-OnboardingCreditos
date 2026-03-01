// backend/domain/entities/Comentario.js
class Comentario{
    constructor(data={}){
        this.id = data.id || null;
        this.solicitud_id = data.solicitud_id || null;
        this.usuario_id = data.usuario_id || null;
        this.tipo = data.tipo || 'operador_a_solicitante';  // operador_a_solicitante, solicitante_a_operador
        this.comentario = data.comentario || '';
        this.leido = data.leido || false;
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }
    static TIPOS = {
        OPERADOR_A_SOLICITANTE: 'operador_a_solicitante',
        SOLICITANTE_A_OPERADOR: 'solicitante_a_operador'
    };
    validarComentario(){
        if(!this.comentario || this.comentario.trim().length ===0){
            throw new Error('El comentario no puede estar vacío');
        }
        if(!this.solicitud_id){
            throw new Error('La solicitud ID es requerida');
        }
        return true;
    }
    marcarComoLeido(){
        this.leido = true;
        this.updated_at = new Date().toISOString();
    }
    esOperadorASolicitante(){
        return this.tipo === Comentario.TIPOS.OPERADOR_A_SOLICITANTE;
    }
    esSolicitanteAOPerador(){
        return this.tipo === Comentario.TIPOS.SOLICITANTE_A_OPERADOR;
    }
    toJSON(){
        return {
            id: this.id,
            solicitud_id: this.solicitud_id,
            usuario_id: this.usuario_id,
            tipo: this.tipo,
            comentario: this.comentario,
            leido: this.leido,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}
module.exports = Comentario;