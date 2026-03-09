// backend/tests/unit/domain/TransferenciaBancaria.test.js
const TransferenciaBancaria = require('../../../domain/entities/TransferenciaBancaria');
describe('TransferenciaBancaria Entity',()=>{
    const datosValidos = {
        solicitud_id: '123e4567-e89b-12d3-a456-426614174000',
        contrato_id: '123e4567-e89b-12d3-a456-426614174001',
        contacto_bancario_id: '123e4567-e89b-12d3-a456-426614174002',
        monto: 100000,
        moneda: 'USD',
        cuenta_destino: '12345678',
        banco_destino: 'Banco Test'
    };
    test('Debe crear una transferencia válida',()=>{
        const transferencia = new TransferenciaBancaria(datosValidos);
        expect(transferencia.estado).toBe(TransferenciaBancaria.ESTADOS.PENDIENTE);
        expect(transferencia.numero_comprobante).toBeDefined();
    });
    test('Debe validar datos obligatorios',()=>{
        const transferencia = new TransferenciaBancaria({monto:-1000});
        expect(()=>transferencia.validar()).toThrow('Datos de transferencia inválidos');
    });
    test('Debe generar número de comprobante único',()=>{
        const comprobante1 = TransferenciaBancaria.generarNumeroComprobante();
        const comprobante2 = TransferenciaBancaria.generarNumeroComprobante();
        expect(comprobante1).not.toBe(comprobante2);
        expect(comprobante1).toMatch(/^TRF-/); 
    });
    test('Debe cambiar estados correctamente',()=>{
        const transferencia = new TransferenciaBancaria(datosValidos);
        transferencia.marcarComoProcesando();
        expect(transferencia.estaProcesando()).toBe(true);
        transferencia.marcarComoCompletada();
        expect(transferencia.estaCompletada()).toBe(true);
        transferencia.marcarComoFallida();
        expect(transferencia.estaFallida()).toBe(true);
    });
    test('Debe asignar ruta de comprobante',()=>{
        const transferencia = new TransferenciaBancaria(datosValidos);
        transferencia.asignarRutaComprobante('comprobantes/123.pdf');
        expect(transferencia.ruta_comprobante).toBe('comprobantes/123.pdf');
    });
});