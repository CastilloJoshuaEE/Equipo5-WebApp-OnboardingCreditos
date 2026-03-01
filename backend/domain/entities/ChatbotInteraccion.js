//backend/domain/entities/ChatbotInteraccion.js
class ChatbotInteraccion{
    constructor(data={}){
        this.id = data.id || null;
        this.usuario_id = data.usuario_id || null;
        this.pregunta = data.pregunta || '';
        this.respuesta = data.respuesta || '';
        this.sentimiento = data.sentimiento || 'neutral';
        this.created_at = data.created_at || new Date().toISOString();
    }
    validarPregunta(){
        if(!this.pregunta || this.pregunta.trim().length ===0){
            throw new Error('La pregunta no puede estar vacía');   
        }
        if(this.pregunta.length >100){
            throw new Error('La pregunta es demasiado larga(máx 1000 caracteres)');
        }
        return true;
    }
    asignarUsuario(usuarioId){
        this.usuario_id =usuarioId;
    }
    esDeUsuarioAutenticado(){
        return this.usuario_id !== null;
    }
    toJSON(){
        return {
            id: this.id,
            usuario_id: this.usuario_id,
            pregunta: this.pregunta,
            respuesta: this.respuesta,
            sentimiento: this.sentimiento,
            created_at: this.created_at
        };
    }

}
module.exports = ChatbotInteraccion;