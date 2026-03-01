// backend/application/use-cases/contactos/ObtenerMisContactos.js
class ObtenerMisContactos{
    constructor(contactoBancarioRepository){
        this.contactoBancarioRepository = contactoBancarioRepository;
    }
    async execute(usuario){
        if(!usuario){
            return {
                success: false,
                status: 401,
                message: 'Usuario no autenticado'
            };
        }
        if(usuario.rol !== 'operador'){
            return { 
                success: false,
                status: 403,
                message: 'Solo los operadores pueden acceder a esta función'
            };
        }
        // Obtener contactos con información de solicitantes
        const contactosProcesados = await this.contactoBancarioRepository.obtenerConSolicitantes();
        return {
            success:true,
            data: contactosProcesados
        };
    }

}
module.exports = ObtenerMisContactos;