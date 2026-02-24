// backend/application/use-cases/firmas/ObtenerFirmasPendientes.js
class ObtenerFirmasPendientes{
    constructor(firmaDigitalRepository){
        this.firmaDigitalRepository = firmaDigitalRepository;
    }
    async execute (usuario){
        const firmas = await this.firmaDigitalRepository.obtenerPendientesPorUsuario(
            usuario.id,
            usuario.rol
        );
        return {
            success: true,
            data: firmas
        };
    }
}
module.exports = ObtenerFirmasPendientes;
