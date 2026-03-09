// backend/tests/unit/domain/Usuario.test.js
const Usuario = require('../../../domain/entities/Usuario');
describe('Usuario Entity',()=>{
    test('Debe crear un usuario válido',()=>{
        const usuario=new Usuario({
            email: 'test@example.com',
            nombre_completo:'Test User',
            dni:'123456789',
            telefono:'+5491112345678'
        });
        expect(usuario.email).toBe('test@example.com');
        expect(usuario.cuenta_activa).toBe(false);
        expect(usuario.rol).toBe('solicitante');
    });
    test('Debe validar email correctamente',()=>{
        const usuario=new Usuario({email:'email-invalido'});
        expect(()=>usuario.validarEmail()).toThrow('Formato de email inválido');
    });
    test('Debe validar teléfono correctamente', () => {
        const usuario = new Usuario({ telefono: '123' });
        expect(() => usuario.validarTelefono()).toThrow();
    });

    test('Debe validar la cuenta correctamente',()=>{
        const usuario = new Usuario({cuenta_activa: false});
        usuario.activar();
        expect(usuario.cuenta_activa).toBe(true);
        expect(usuario.fecha_desactivacion).toBeNull();

    });
    test('Debe desactivar la cuenta correctamente',()=>{
        const usuario = new Usuario({cuenta_activa: true});
        usuario.desactivar('Motivo de prueba');
        expect(usuario.cuenta_activa).toBe(false);
        expect(usuario.fecha_desactivacion).toBeDefined();
    });
    test('Debe identificar roles correctamente',()=>{
        const solicitante = new Usuario ({rol:'solicitante'});
        const operador = new Usuario ({rol:'operador'});
        expect(solicitante.esSolicitante()).toBe(true);
        expect(solicitante.esOperador()).toBe(false);
        expect(operador.esOperador()).toBe(true);
    });
});