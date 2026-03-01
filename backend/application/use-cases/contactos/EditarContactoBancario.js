// backend/application/use-cases/contactos/EditarContactoBancario.js
const ContactoBancario = require('../../../domain/entities/ContactoBancario');
class EditarContactoBancario{
    constructor(contactoBancarioRepository){
        this.contactoBancarioRepository = contactoBancarioRepository;
    }
    async execute(id, data, usuario){
        const{
            numero_cuenta,
            tipo_cuenta,
            moneda,
            nombre_banco,
            email_contacto,
            telefono_contacto
        } = data;
        if(usuario.rol !== 'operador'){
            return {
                success: false,
                status: 403,
                message: 'Solo los operadores pueden editar contactos bancarios'
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
        // Validar campos
        if( numero_cuenta && !numero_cuenta.toString().trim()){
            return{
                success: false,
                status: 400,
                message: 'Número de cuenta es requerido'
            };
        }
        // Crear entidad temporal para validaciones
        const contactoEntity = new ContactoBancario({
            numero_cuenta,
            tipo_cuenta,
            moneda,
            nombre_banco,
            email_contacto,
            telefono_contacto
        });
        try{
            if(numero_cuenta) contactoEntity.validarNumeroCuenta();
            if(telefono_contacto) contactoEntity.validarTelefono();
            if(email_contacto) contactoEntity.validarEmail();
        } catch(error){
            return {
                success: false,
                status: 400,
                message: error.message
            };
        }
        // Verificar duplicado de número de cuenta
        if(numero_cuenta && numero_cuenta !== contactoExistente.numero_cuenta){
            const existeContacto = await this.contactoBancarioRepository.existeNumeroCuenta(numero_cuenta, id);
            if(existeContacto){
                return{
                    success: false,
                    status: 400,
                    message: 'Ya existe un contacto con ese número de cuenta'
                };
            }
        }
        const updateData= {
            ...(numero_cuenta && { numero_cuenta }),
            ...(tipo_cuenta && { tipo_cuenta }),
            ...(moneda && { moneda }),
            ...(nombre_banco && { nombre_banco }),
            ...(email_contacto !== undefined && { email_contacto }),
            ...(telefono_contacto !== undefined && { telefono_contacto }),
            updated_at: new Date().toISOString()
            };
        const contacto = await this.contactoBancarioRepository.actualizar(id, updateData);
        return{
            success: true,
            message: 'Contacto bancario actualizado exitosamente',
            data: contacto
        };


    }
}
module.exports = EditarContactoBancario;