// backend/application/use-cases/firmas/ObtenerAuditoriaFirma.js
class ObtenerAuditoriaFirma {
    constructor(firmaDigitalRepository){
        this.firmaDigitalRepository = firmaDigitalRepository;
    }
    async execute(firma_id, usuario){
        // Verificar permisos
        const tienePermisos= await this.firmaDigitalRepository.verificarPermisos(
            firma_id,
            usuario.id,
            usuario.rol
        );
        if(!tienePermisos){
            return {
                success: false,
                status: 403,
                message: 'No tiene permisos para acceder a esta auditoría'
            };
        }
        const auditoria = await this.firmaDigitalRepository.obtenerAuditoria(firma_id);
        return {
            success: true,
            data: auditoria
        };
    }
}
module.exports = ObtenerAuditoriaFirma;
