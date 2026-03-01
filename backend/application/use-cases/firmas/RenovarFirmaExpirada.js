// backend/application/use-cases/firmas/RenovarFirmaExpirada.js
class RenovarFirmaExpirada{
    constructor(firmaDigitalRepository){
        this.firmaDigitalRepository = firmaDigitalRepository;

    }
    async execute(firma_id, usuario){
        const firmaRenovada = await this.firmaDigitalRepository.renovarFirmaExpirada(firma_id);
        // Registrar auditoria
        await this.firmaDigitalRepository.registrarAuditoria({
            firma_id: firma_id,
            usuario_id: usuario.id,
            accion: 'renovar_firma_expirada',
            descripcion: 'Firma expirada renovada exitosamente',
            estado_anterior: 'expirado',
            estado_nuevo: 'enviado',
            ip_address: usuario.ip,
            user_agent: usuario.userAgent,
            created_at: new Date().toISOString()
        });
        return {
            success: true,
            message: 'Firma renovada exitosamente',
            data: {
                firma_id: firmaRenovada.id,
                fecha_expiracion: firmaRenovada.fecha_expiracion
            }
        };
    }
}
module.exports = RenovarFirmaExpirada;
