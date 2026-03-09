// backend/tests/unit/domain/Solicitud.test.js
const Solicitud = require('../../../domain/entities/Solicitud');
describe('Solicitud Entity',()=>{
    const datosValidos ={
        monto: 100000,
        plazo_meses:12,
        proposito: 'Capital de trabajo para expansión de negocio',
        moneda: 'USD'
    };
    test('Debe crear una solicitud válida',()=>{
        const solicitud = new Solicitud(datosValidos);
        expect(solicitud.monto).toBe(100000);
        expect(solicitud.estado).toBe(Solicitud.ESTADOS.BORRADOR);
        expect(solicitud.nivel_riesgo).toBe(Solicitud.NIVELES_RIESGO.MEDIO);
    });
    test('Debe validar datos obligatorios',()=>{
        const solicitud = new Solicitud({monto: -100, plazo_meses:0, proposito:'corto'});
        expect(()=>solicitud.validar()).toThrow('Monto debe ser mayor a 0');
    });
    test('Debe calcular correctamente si puede ser enviada',()=>{
        const solicitud = new Solicitud(datosValidos);
        expect(solicitud.puedeSerEnviada(true)).toBe(true);
        expect(solicitud.puedeSerEnviada(false)).toBe(false);
    });
    test('Debe cambiar estado a enviado',()=>{
        const solicitud = new Solicitud(datosValidos);
        solicitud.enviar();
        expect(solicitud.estado).toBe(Solicitud.ESTADOS.ENVIADO);
        expect(solicitud.fecha_envio).toBeDefined();
    });
    test('Debe calcular scoring correctamente',()=>{
        const solicitud= new Solicitud(datosValidos);
        const scoring = solicitud.calcularScoring(3) // 3 documentos validados
        expect(scoring).toBe(60);
        expect(solicitud.nivel_riesgo).toBe(Solicitud.NIVELES_RIESGO.MEDIO);
    });
    test('Debe calcular nivel de riesgo según scoring',()=>{
        const solicitud = new Solicitud(datosValidos);
        expect(solicitud.calcularNivelRiesgo(90)).toBe(Solicitud.NIVELES_RIESGO.BAJO);
        expect(solicitud.calcularNivelRiesgo(70)).toBe(Solicitud.NIVELES_RIESGO.MEDIO);
        expect(solicitud.calcularNivelRiesgo(50)).toBe(Solicitud.NIVELES_RIESGO.ALTO);
    });


});