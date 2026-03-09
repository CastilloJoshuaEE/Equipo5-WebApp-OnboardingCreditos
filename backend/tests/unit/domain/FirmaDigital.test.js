// backend/tests/unit/domain/FirmaDigital.test.js
const FirmaDigital = require('../../../domain/entities/FirmaDigital');
describe('FirmaDigital Entity',()=>{
    const datosValidos = {
        contrato_id: '123e4567-e89b-12d3-a456-426614174000',
        solicitud_id: '123e4567-e89b-12d3-a456-426614174000',
        hash_documento_original: 'abc123hash'
    };
    test('Debe crear una firma digital válida',()=>{
        const firma = new FirmaDigital(datosValidos);
        expect(firma.estado).toBe(FirmaDigital.ESTADOS.PENDIENTE);
        expect(firma.integridad_valida).toBe(false);
        expect(firma.intentos_envio).toBe(0);
    });
    test('Debe detectar firma expirada',()=>{
        const firma = new FirmaDigital({
            ...datosValidos,
            fecha_expiracion: new Date(Date.now()-86400000) // Ayer
        });
        expect(firma.estaExpirada()).toBe(true);
    });
    test('Debe marcar firma de solicitante correctamente',()=>{
        const firma = new FirmaDigital(datosValidos);
        firma.marcarFirmaSolicitante('192.168.1.1', 'Mozilla/5.0', 'Buenos Aires');
        expect(firma.fecha_firma_solicitante).toBeDefined();
        expect(firma.estado).toBe(FirmaDigital.ESTADOS.FIRMADO_SOLICITANTE);
        expect(firma.ip_firmante).toBe('192.168.1.1');
    });
    test('Debe marcar firma de operador correctamente', ()=>{
        const firma = new FirmaDigital(datosValidos);
        firma.marcarFirmaOperador();
        expect(firma.fecha_firma_operador).toBeDefined();
        expect(firma.estado).toBe(FirmaDigital.ESTADOS.FIRMADO_OPERADOR);
    });
    test('Debe completar firma cuando ambas partes firmaron',()=>{
        const firma = new FirmaDigital(datosValidos);
        firma.marcarFirmaSolicitante('192.168.1.1', 'Mozilla/5.0', 'Buenos Aires');
        firma.marcarFirmaOperador();
        expect(firma.estado).toBe(FirmaDigital.ESTADOS.FIRMADO_COMPLETO);
        expect(firma.fecha_firma_completa).toBeDefined();
        expect(firma.integridad_valida).toBe(true);
    });
    test('Debe incrementar intentos al renovar',()=>{
        const firma = new FirmaDigital(datosValidos);
        firma.renovar();
        expect(firma.intentos_envio).toBe(1);
        expect(firma.estado).toBe(FirmaDigital.ESTADOS.ENVIADO);
    });
});