// backend/domain/entities/FirmaDigital.js
class FirmaDigital{
    constructor(data={}){
        this.id = data.id || null;
        this.contrato_id = data.contrato_id || null;
        this.solicitud_id = data.solicitud_id || null;
        this.signature_request_id = data.signature_request_id || null;
        this.ruta_documento = data.ruta_documento || null;
        this.url_documento_firmado = data.url_documento_firmado || null;
        this.hash_documento_original = data.hash_documento_original || '';
        this.hash_documento_firmado = data.hash_documento_firmado || null;
        this.estado = data.estado || 'pendiente';
        this.url_firma_solicitante = data.url_firma_solicitante || null;
        this.url_firma_operador = data.url_firma_operador || null;
        this.fecha_envio = data.fecha_envio || null;
        this.fecha_expiracion = data.fecha_expiracion || null;
        this.fecha_firma_solicitante = data.fecha_firma_solicitante || null;
        this.fecha_firma_operador = data.fecha_firma_operador || null;
        this.fecha_firma_completa = data.fecha_firma_completa || null;
        this.integridad_valida = data.integridad_valida || false;
        this.intentos_envio = data.intentos_envio || 0;
        this.ip_firmante = data.ip_firmante || null;
        this.user_agent_firmante = data.user_agent_firmante || null;
        this.ubicacion_firmante = data.ubicacion_firmante || null;
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }
    static ESTADOS = {
        PENDIENTE: 'pendiente',
        ENVIADO: 'enviado',
        FIRMADO_SOLICITANTE: 'firmado_solicitante',
        FIRMADO_OPERADOR: 'firmado_operador',
        FIRMADO_COMPLETO: 'firmado_completo',
        EXPIRADO: 'expirado',
        RECHAZADO: 'rechazado'
    };
    estaCompleta(){
        return this.estado === FirmaDigital.ESTADOS.FIRMADO_COMPLETO;
    }
    estaExpirada(){
        if(!this.fecha_expiracion) return false;
        return new Date(this.fecha_expiracion)< new Date();
    }
    tieneFirmaSolicitante(){
        return !!this.fecha_firma_solicitante;
    }
    tieneFirmaOperador(){
        return !!this.fecha_firma_operador;
    }
    tieneIntegridadValida(){
        return this.integridad_valida === true;
    }
    incrementarIntento(){
        this.intentos_envio +=1;
        this.updated_at = new Date().toISOString();
    }
    marcarFirmaSolicitante(ip, userAgent, ubicacion){
        this.fecha_firma_solicitante = new Date().toISOString();
        this.ip_firmante = ip;
        this.user_agent_firmante = userAgent;
        this.ubicacion_firmante = ubicacion;
        this.updated_at = new Date().toISOString();
        if(this.fecha_firma_operador){
            this.estado = FirmaDigital.ESTADOS.FIRMADO_COMPLETO;
            this.fecha_firma_completa = new Date().toISOString();
            this.integridad_valida = true;

        } else {
            this.estado = FirmaDigital.ESTADOS.FIRMADO_SOLICITANTE;
        }
    }
    marcarFirmaOperador(){
        this.fecha_firma_operador = new Date().toISOString();
        this.updated_at = new Date().toISOString();
        if(this.fecha_firma_solicitante){
            this.estado = FirmaDigital.ESTADOS.FIRMADO_COMPLETO;
            this.fecha_firma_completa = new Date().toISOString();
            this.integridad_valida = true;
        } else{
            this.estado = FirmaDigital.ESTADOS.FIRMADO_OPERADOR;
        }
    }
    renovar(){
        this.estado = FirmaDigital.ESTADOS.ENVIADO;
        this.fecha_envio = new Date().toISOString();
        this.fecha_expiracion = new Date(Date.now()+7*24*60*60*1000).toISOString();
        this.intentos_envio +=1;
        this.updated_at = new Date().toISOString();
    }
  toJSON() {
    return {
      id: this.id,
      contrato_id: this.contrato_id,
      solicitud_id: this.solicitud_id,
      signature_request_id: this.signature_request_id,
      ruta_documento: this.ruta_documento,
      url_documento_firmado: this.url_documento_firmado,
      hash_documento_original: this.hash_documento_original,
      hash_documento_firmado: this.hash_documento_firmado,
      estado: this.estado,
      url_firma_solicitante: this.url_firma_solicitante,
      url_firma_operador: this.url_firma_operador,
      fecha_envio: this.fecha_envio,
      fecha_expiracion: this.fecha_expiracion,
      fecha_firma_solicitante: this.fecha_firma_solicitante,
      fecha_firma_operador: this.fecha_firma_operador,
      fecha_firma_completa: this.fecha_firma_completa,
      integridad_valida: this.integridad_valida,
      intentos_envio: this.intentos_envio,
      ip_firmante: this.ip_firmante,
      user_agent_firmante: this.user_agent_firmante,
      ubicacion_firmante: this.ubicacion_firmante,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = FirmaDigital;