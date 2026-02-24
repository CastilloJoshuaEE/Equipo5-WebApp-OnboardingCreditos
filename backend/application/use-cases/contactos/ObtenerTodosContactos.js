// backend/application/use-cases/contactos/ObtenerTodosContactos.js
class ObtenerTodosContactos{
    constructor(contactoBancarioRepository){
        this.contactoBancarioRepository = contactoBancarioRepository;
    }
    async execute(usuario){
        if(usuario.rol !== 'operador'){
            return {
                success: false,
                status: 403,
                message: 'Solo los operadores pueden ver todos los contactos'
            };
        }
        console.log('Obteniendo todos los contactos bancarios');
        const contactos = await this.contactoBancarioRepository.obtenerTodos();
        console.log(`Contactos encontrados: ${contactos.length}`);
        return{
            success: true,
            data: contactos
        };
    }
}
module.exports = ObtenerTodosContactos;