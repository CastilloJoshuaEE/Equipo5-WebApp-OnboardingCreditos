// backend/domain/repositories/ContactoBancarioRepository.js
class ContactoBancarioRepository{
    async crear(contactoData){
        throw new Error('Método no implementado');
    }
    async actualizar(id, updateData){
        throw new Error('Método no implementado');
    }
    async eliminar(id){
        throw new Error('Método no implementado');
    }
    async obtenerPorId(id){
        throw new Error('Método no implementado');
    }
    async obtenerTodos(activos = true){
        throw new Error('Método no implementado');
    }
    async obtenerConSolicitantes(){
        throw new Error('Método no implementado');
    }
    async buscarPorNumeroCuenta(numero_cuenta){
        throw new Error('Método no implementado');
    }
    async buscarAvanzado(criterios){
        throw new Error('Método no implementado');
    }
    async existeNumeroCuenta(numero_cuenta, excludeId = null){
        throw new Error('Método no implementado');
    }
    async obtenerSolicitantePorEmail(email){
        throw new Error('Método no implementado');
    }
    async obtenerEstadisticas() {
        throw new Error('Método no implementado');
    }
}

module.exports = ContactoBancarioRepository;