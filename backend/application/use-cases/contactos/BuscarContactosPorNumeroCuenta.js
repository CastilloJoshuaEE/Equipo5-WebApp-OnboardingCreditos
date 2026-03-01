// backend/application/use-cases/contactos/BuscarContactosPorNumeroCuenta.js
class BuscarContactosPorNumeroCuenta{
    constructor(contactoBancarioRepository){
        this.contactoBancarioRepository = contactoBancarioRepository;
    }
    async execute({numero_cuenta}, usuario){
        if(!numero_cuenta){
            return{
                success: false,
                status: 400,
                message: 'Número de cuenta es requerido'
            };
        }
        const contactos = await this.contactoBancarioRepository.buscarPorNumeroCuenta(numero_cuenta);
        return {
            success: true,
            data: {
                contactos
            }
        };
    }
    
}
module.exports = BuscarContactosPorNumeroCuenta;