// backend/domain/entities/WebhookPayload.js
class WebhookPayload{
    constructor(data = {}){
        this.session_id = data.session_id || '';
        this.status = data.status || '';
        this.webhook_type = data.webhook_type || '';
        this.decision = data.decision || null;
        this.raw_data = data;
    }
    esDeDidit(){
        return this.webhook_type === 'didit' || this.session_id.startsWith('didit');
    }
    esAprobada(){
        return this.status === 'Approved';
    }
    esRechazada(){
        return this.status === 'Rejected' || this.status === 'Declined';
    }
   
    obtenerIdVerificacion() {
        return this.decision?.id_verification || null;
    }

    toJSON() {
        return {
        session_id: this.session_id,
        status: this.status,
        webhook_type: this.webhook_type,
        decision: this.decision
        };
    }
}

module.exports = WebhookPayload;