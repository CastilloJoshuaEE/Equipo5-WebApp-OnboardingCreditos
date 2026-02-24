// backend/domain/entities/VerificacionKYC.js
class VerificacionKYC{
    constructor(data={}){
        this.id = data.id || null;
        this.solicitud_id = data.solicitud_id || null;
        this.session_id = data.session_id || '';
        this.proveedor = data.proveedor || 'didit';
        this.estado = data.estado || 'pendiente';
        this.datos_verificacion = data.datos_verificacion || null;
        this.created_at = data.created_at || new Date().toISOString();
        this.actualizado_en  = data.actualizado_en || new Date().toISOString();
    }
    static ESTADOS = {
        PENDIENTE: 'pendiente',
        APROBADO: 'aprobado',
        RECHAZADO: 'rechazado',
        EN_PROCESO: 'en_proceso'
    };
    static PROVEEDORES = {
        DIDIT: 'didit'
    };
    estaAprobada(){
        return this.estado === VerificacionKYC.ESTADOS.APROBADO;
    }
    estaRechazada(){
        return this.estado === VerificacionKYC.ESTADOS.RECHAZADO;
    }
    estaPendiente(){
        return this.estado === VerificacionKYC.ESTADOS.PENDIENTE;
    }
    actualizarEstado(estado, datosVerificacion = null){
        this.estado = estado;
        if(datosVerificacion){
            this.datos_verificacion = datosVerificacion;
        }
        this.actualizado_en = new Date().toISOString();
    }
    toJSON() {
        return {
        id: this.id,
        solicitud_id: this.solicitud_id,
        session_id: this.session_id,
        proveedor: this.proveedor,
        estado: this.estado,
        datos_verificacion: this.datos_verificacion,
        created_at: this.created_at,
        actualizado_en: this.actualizado_en
        };
    }
}

module.exports = VerificacionKYC;