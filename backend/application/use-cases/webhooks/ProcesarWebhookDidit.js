// backend/application/use-cases/webhooks/ProcesarWebhookDidit.js
const WebhookPayload = require('../../../domain/entities/WebhookPayload');
class ProcesarWebhookDidit{
    constructor(verificacionKYCRepository, documentoRepository, diditService){
        this.verificacionKYCRepository = verificacionKYCRepository;
        this.documentoRepository = documentoRepository;
        this.diditService = diditService;
    }
    async execute ( payload, signature, timestamp){
        console.log('Webhook recibido de Didit:', payload.session_id);
        if(!this.diditService.verifyWebhookSignature(payload, signature, timestamp)){
            console.error('Firma de webhook inválida');
            return {
                success: false,
                status: 401,
                message: 'Firma inválida'
            };
        }
        const webhookPayload = new WebhookPayload(payload);
        const { session_id, status, decision} = webhookPayload;
        const verificacion = await this.verificacionKYCRepository.findBySessionId(session_id);
        if(!verificacion){
            console.error('Verificación no encontrada:', session_id);
            return {
                success: false,
                status: 404,
                message: 'Verificación no encontrada'
            };
        }
        await this.verificacionKYCRepository.updateBySessionId(session_id, {
        estado: status.toLowerCase(),
        datos_verificacion: decision || null,
        actualizado_en: new Date().toISOString()
        });
        if(webhookPayload.esAprobada() && decision?.id_verification){
            await this.actualizarDocumentosVerificados(verificacion.solicitud_id, decision.id_verification);
            
        }
        console.log(`Webhook procesado: ${session_id}-${status}`);
        return {
            success: true,
            message: 'Webhook procesado'
        };

    }
    async actualizarDocumentosVerificados(solicitudId, idVerification){
        try {
            const documentos = await this.documentoRepository.findByTipoYSolicitud(solicitudId, 'dni');
            if(documentos && documentos.length >0){
                const documento = documentos[0];
                await this.documentoRepository.update(documento.id,{
                    estado: 'validado',
                    comentarios: `Verificado automáticamente por Didit- ${idVerification.document_Type}`,
                    validado_en: new Date().toISOString()
                });
                console.log(`Documento DNI validado automáticamente para solicitud:${solicitudId}`);
            }

        } catch (error) {
            console.error('Error actualizando documentos:', error);
        }
    }


}
module.exports = ProcesarWebhookDidit;
