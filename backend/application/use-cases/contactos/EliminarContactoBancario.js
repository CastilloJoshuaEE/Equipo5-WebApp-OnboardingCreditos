// backend/application/use-cases/contactos/EliminarContactoBancario.js
class EliminarContactoBancario{
    constructor(contactoBancarioRepository){
        this.contactoBancarioRepository = contactoBancarioRepository;
    }
    async execute (id, usuario){
        if(usuario.rol !== 'operador'){
            return {
                success: false,
                status: 403,
                message: 'Solo los operadores pueden eliminar contactos bancarios'
            };
        }
        // Verificar que el contacto existe
        const contactoExistente = await this.contactoBancarioRepository.obtenerPorId(id);
        if(!contactoExistente){
            return {
                success: false,
                status: 404,
                message: 'Contacto bancario no encontrado'
            };
        }
        const contacto = await this.contactoBancarioRepository.eliminar(id);
        return {
            success: true,
            message: 'Contacto bancario eliminado exitosamente',
            data: contacto
        };
    }
}
module.exports = EliminarContactoBancario;
