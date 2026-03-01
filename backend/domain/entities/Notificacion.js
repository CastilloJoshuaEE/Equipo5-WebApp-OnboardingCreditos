// backend/domain/entities/Notificacion.js
const { v4: uuidv4 } = require('uuid');

class Notificacion{
    constructor(data = {}){
        this.id = data.id ||  uuidv4();
        this.usuario_id = data.usuario_id || null;
        this.solicitud_id = data.solicitud_id || null;
        this.tipo = data.tipo || '';
        this.titulo = data.titulo || '';
        this.mensaje = data.mensaje || '';
        this.datos_adicionales = data.datos_adicionales || {};
        this.leida = data.leida || false;
        this.created_at = data.created_at || new Date().toISOString();
    }
    static TIPOS = {
        FIRMA_DIGITAL_SOLICITANTE: 'firma_digital_solicitante',
        FIRMA_DIGITAL_OPERADOR: 'firma_digital_operador',
        FIRMA_SOLICITANTE_COMPLETADA: 'firma_solicitante_completada',
        FIRMA_OPERADOR_COMPLETADA: 'firma_operador_completada',
        FIRMA_COMPLETADA_OPERADOR: 'firma_completada_operador',
        FIRMA_COMPLETADA_SOLICITANTE: 'firma_completada_solicitante',
        FIRMA_RECHAZADA: 'firma_rechazada',
        FIRMA_EXPIRADA_SOLICITANTE: 'firma_expirada_solicitante',
        FIRMA_EXPIRADA_OPERADOR: 'firma_expirada_operador',
        SOLICITUD_APROBADA: 'solicitud_aprobada',
        SOLICITUD_APROBADA_OPERADOR: 'solicitud_aprobada_operador',
        NUEVO_COMENTARIO: 'nuevo_comentario',
        ERROR_FIRMA_DIGITAL_AUTOMATICA: 'error_firma_digital_automatica'
    };
    marcarComoLeida(){
        this.leida = true;
    }
    esParaUsuario(usuarioId){
        return this.usuario_id === usuarioId;
    }
    esDeFirma(){
        return this.tipo.includes('firma');
    }
    esDeSolicitud(){
        return this.solicitud_id !== null;
    }
    tieneDatosAdicionales(){
        return Object.keys(this.datos_adicionales).length >0;
    }
    toJSON(){
        return {
            id: this.id,
            usuario_id: this.usuario_id,
            solicitud_id: this.solicitud_id,
            tipo: this.tipo,
            titulo: this.titulo,
            mensaje: this.mensaje,
            datos_adicionales: this.datos_adicionales,
            leida: this.leida,
            created_at: this.created_at

        };
    }
}
module.exports = Notificacion;
