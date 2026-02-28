// backend/domain/entities/ContactoBancario.js
const { v4: uuidv4 } = require('uuid');

class ContactoBancario{
    constructor(data ={}){
        this.id = data.id || uuidv4();
        this.numero_cuenta = data.numero_cuenta || '';
        this.tipo_cuenta = data.tipo_cuenta || 'ahorros';
        this.moneda = data.moneda || 'USD';
        this.nombre_banco = data.nombre_banco || 'Nexia';
        this.email_contacto = data.email_contacto || '';
        this.telefono_contacto = data.telefono_contacto || '';
        this.solicitante_id = data.solicitante_id || null;
        this.estado = data.estado || 'activo';
        this.created_at = data.created_at || new Date().toISOString();
        this.updated_at = data.updated_at || new Date().toISOString();
    }
    validarNumeroCuenta(){
        const cuentaRegex = /^\d{6,24}$/;
        if(!this.numero_cuenta || !cuentaRegex.test(this.numero_cuenta.toString())){
            throw new Error('Número de cuenta inválido. Debe ser numérico (6-24 dígitos)');

        }
        return true;
    }
    validarTelefono(){
        if(this.telefono_contacto && !/^\+?\d{7,15}$/.test(this.telefono_contacto)) {
            throw new Error('Teléfono inválido. Formato: +59311111111 (solo dígitos, 7-15)');
        }
        return true;
    }
    validarEmail(){
        if(this.email_contacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email_contacto)) {
            throw new Error('Formato de email inválido');
        }
        return true;
    }
    desactivar(){
        this.estado = 'inactivo';
        this.updated_at = new Date().toISOString();
    }
    toJSON(){
        return{
            id: this.id,
            numero_cuenta: this.numero_cuenta,
            tipo_cuenta: this.tipo_cuenta,
            moneda: this.moneda,
            nombre_banco: this.nombre_banco,
            email_contacto: this.email_contacto,
            telefono_contacto: this.telefono_contacto,
            solicitante_id: this.solicitante_id,
            estado: this.estado,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}
module.exports = ContactoBancario;
