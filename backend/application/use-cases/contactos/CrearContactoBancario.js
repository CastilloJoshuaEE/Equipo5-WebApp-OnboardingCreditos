// backend/application/use-cases/contactos/CrearContactoBancario.js
const ContactoBancario = require('../../../domain/entities/ContactoBancario');
class CrearContactoBancario{
    constructor(contactoBancarioRepository){
        this.contactoBancarioRepository = contactoBancarioRepository;
    }
    async execute(data, usuario){
        const{
            numero_cuenta,
            tipo_cuenta = 'ahorros',
            moneada = 'USD',
            nombre_cuenta = 'Nexia',
            email_contacto,
            telefono_contacto
        }= data;
        // Validaciones básicas
        if(!numero_cuenta || !numero_cuenta.toString().trim()){
            return{
                success: false,
                status: 400,
                message: 'Número de cuenta es requerido'
            };
        }
        // Crear entidad y validar
        const contactoEntity = new ContactoBancario({
            numero_cuenta,
            tipo_cuenta,
            moneda,
            nombre_banco,
            email_contacto,
            telefono_contacto
        });
        try{
            contactoEntity.validarNumeroCuenta();
            contactoEntity.validarTelefono();
            contactoEntity.validarEmail();
        } catch(error){
            return {
                success: false,
                status: 400,
                message: error.message
            };
        }
        // Verificar si el email pertenece a un solicitante
        console.log('Buscando solicitante por email:', email_contacto);
        const usuarioSolicitante = await this.contactoBancarioRepository.obtenerSolicitantePorEmail(email_contacto);
        if(!usuarioSolicitante){
            console.log('No se encontró solicitante con email:', email_contacto);
            return {
                success: false, 
                status: 404,
                message: 'No se encontró un solicitante registrado con ese email'
            };
        }
        contactoEntity.solicitante_id = usuarioSolicitante.id;
        console.log('Solicitante encontrado:', contactoEntity.solicitante_id);
        // Verificar si ya existe un contacto con el mismo número de cuenta
        const existeContacto = await this.contactoBancarioRepository.existeNumeroCuenta(numero_cuenta);
        if(existeContacto){
            return {
                success: false,
                status: 400,
                message: 'Ya existe un contacto con ese número de cuenta'
            };
        }
        console.log('Guardando contacto bancario:', contactoEntity.toJSON());
        // Crear contacto
        const contacto = await this.contactoBancarioRepository.crear(contactoEntity.toJSON());
        console.log('Contacto bancario creado exitosamente:', contacto.id);
        return{
            success: true,
            status: 201,
            message: 'Contacto bancario creado exitosamente',
            data: contacto
        };
    }
}
module.exports = CrearContactoBancario;