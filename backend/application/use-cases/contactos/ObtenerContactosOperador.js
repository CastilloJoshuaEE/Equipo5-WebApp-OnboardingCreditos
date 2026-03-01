// backend/application/use-cases/contactos/ObtenerContactosOperador.js
class ObtenerContactosOperador{
    constructor(contactoBancarioRepository){
        this.contactoBancarioRepository = contactoBancarioRepository;
    }
    async execute (usuario){
        if(usuario.rol !== 'operador'){
            return {
                success: false,
                status: 403,
                message: 'Solo los operadores pueden acceder a esta función'
            };
        }
        const contactos = await this.contactoBancarioRepository.obtenerTodos();
        return{
            success: true,
            data: contactos
        };
    }
}
module.exports = ObtenerContactosOperador;