// backend/domain/entities/Contrato.js
const { v4: uuidv4 } = require('uuid');

class Contrato{
    constructor(data={}){
        this.id = data.id || uuidv4();
        this.solicitud_id = data.solicitud_id || null;
        this.numero_contrato = data.numero_contrato || '';
        this.monto_aprobado = data.monto_aprobado || 0;
        this.tasa_interes = data.tasa_interes || 0;
        this.plazo_meses = data.plazo_meses || 0;
        this.estado = data.estado || 'generado';
        this.tipo= data.tipo || 'credito_estandar';
        this.ruta_documento = data.ruta_documento || null;
        this.hash_contrato = data.hash_contrato || null;
        this.firma_digital_id = data.firma_digital_id || null;
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }
    static ESTADOS = {
        GENERADO: 'generado',
        PENDIENTE_FIRMA: 'pendiente_firma',
        FIRMADO_SOLICITANTE: 'firmado_solicitante',
        FIRMADO_OPERADOR: 'firmado_operador',
        FIRMADO_COMPLETO: 'firmado_completo',
        VIGENTE: 'vigente'
    };
    validarDatos(){
        const errors = [];
        if(!this.solicitud_id) errors.push('solicitud_id es requerido');
        if(!this.numero_contrato) errors.push('numero_contrato es requerido');
        if(!this.monto_aprobado || this.monto_aprobado <=0) errors.push('monto_aprobado debe ser mayor a 0');
        if(!this.tasa_interes || this.tasa_interes <=0) errors.push('tasa_interes debe ser mayor a 0');
        if(!this.plazo_meses || this.plazo_meses <=0) errors.push('plazo_meses debe ser mayor a 0');
        return errors;
    }
    estaCompletamenteFirmado(){
        return this.estado === Contrato.ESTADOS.FIRMADO_COMPLETO;
    }
    tieneDocumento(){
        return !!this.ruta_documento;
    }
    toJSON(){
        return {
            id: this.id,
            solicitud_id: this.solicitud_id,
            numero_contrato: this.numero_contrato,
            monto_aprobado: this.monto_aprobado,
            tasa_interes: this.tasa_interes,
            plazo_meses: this.plazo_meses,
            estado: this.estado,
            tipo: this.tipo,
            ruta_documento: this.ruta_documento, 
            hash_contrato: this.hash_contrato,
            firma_digital_id: this.firma_digital_id, 
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}
module.exports = Contrato;
