// backend/tests/unit/application/transferencias/CrearTransferencia.test.js
const CrearTransferencia = require('../../../../application/use-cases/transferencias/CrearTransferencia');
const {
    mockTransferenciaRepository,
    mockNotificacionService,
    mockSupabase
} = require('../../infrastructure/repositories/mocks/repositoryMocks');

describe('CrearTransferencia Use Case', () => {
    let crearTransferencia;

    beforeEach(() => {
        jest.clearAllMocks();
        crearTransferencia = new CrearTransferencia(
            mockTransferenciaRepository,
            mockNotificacionService,
            mockSupabase
        );
    });

    const usuarioOperador = {
        id: 'operador-123',
        rol: 'operador'
    };

    const datosTransferencia = {
        solicitud_id: 'solicitud-123',
        contacto_bancario_id: 'contacto-123',
        monto: 100000,
        moneda: 'USD',
        motivo: 'Transferencia de crédito'
    };

    const solicitudAprobada = {
        id: 'solicitud-123',
        solicitante_id: 'solicitante-123',
        monto: 100000,
        moneda: 'USD'
    };

    const contratoFirmado = {
        id: 'contrato-123',
        estado: 'firmado_completo'
    };

    const contactoBancario = {
        id: 'contacto-123',
        solicitante_id: 'solicitante-123',
        numero_cuenta: '12345678',
        nombre_banco: 'Banco Test'
    };

// Helper para construir un mock de cadena fluida con single
const mockChainSingle = (data, error = null) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error })
});

// Helper para construir un mock de cadena fluida con maybeSingle
const mockChainMaybeSingle = (data, error = null) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error })
});

    test(' Debe crear transferencia exitosamente', async () => {
        // Orden de llamadas: 1) solicitud  2) contrato  3) contacto_bancario
        mockSupabase.from
            .mockImplementationOnce(() => mockChainSingle(solicitudAprobada))       // 1. solicitud
            .mockImplementationOnce(() => mockChainMaybeSingle(contratoFirmado))    // 2. contrato
            .mockImplementationOnce(() => mockChainSingle(contactoBancario));       // 3. contacto

        mockTransferenciaRepository.verificarTransferenciaExistente.mockResolvedValue(null);
        mockTransferenciaRepository.crear.mockResolvedValue({
            id: 'transferencia-123',
            ...datosTransferencia
        });

        const result = await crearTransferencia.execute(datosTransferencia, usuarioOperador);

        expect(result.success).toBe(true);
        expect(result.status).toBe(201);
        expect(mockTransferenciaRepository.crear).toHaveBeenCalled();
    });

    test(' Debe fallar si solicitud no existe', async () => {
        // 1. solicitud → no encontrada
        mockSupabase.from
            .mockImplementationOnce(() => mockChainSingle(null, { message: 'Not found' }));

        const result = await crearTransferencia.execute(datosTransferencia, usuarioOperador);

        expect(result.success).toBe(false);
        expect(result.status).toBe(404);
        expect(result.message).toBe('Solicitud no encontrada');
    });

    test(' Debe fallar si contrato no está firmado', async () => {
        // 1. solicitud → encontrada  2. contrato → no existe (null)
        mockSupabase.from
            .mockImplementationOnce(() => mockChainSingle(solicitudAprobada))       // 1. solicitud
            .mockImplementationOnce(() => mockChainMaybeSingle(null));              // 2. contrato inexistente

        const result = await crearTransferencia.execute(datosTransferencia, usuarioOperador);

        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        expect(result.message).toContain('No existe un contrato válido');
    });

    test(' Debe fallar si contacto bancario no existe', async () => {
        // 1. solicitud  2. contrato firmado  3. contacto → no encontrado
        mockSupabase.from
            .mockImplementationOnce(() => mockChainSingle(solicitudAprobada))               // 1. solicitud
            .mockImplementationOnce(() => mockChainMaybeSingle(contratoFirmado))            // 2. contrato
            .mockImplementationOnce(() => mockChainSingle(null, { message: 'Not Found' })); // 3. contacto

        const result = await crearTransferencia.execute(datosTransferencia, usuarioOperador);

        expect(result.success).toBe(false);
        expect(result.status).toBe(404);
        expect(result.message).toBe('Contacto bancario no encontrado');
    });

    test(' Debe fallar si ya existe transferencia', async () => {
        // 1. solicitud  2. contrato  3. contacto  → todos OK, pero ya hay transferencia
        mockSupabase.from
            .mockImplementationOnce(() => mockChainSingle(solicitudAprobada))    // 1. solicitud
            .mockImplementationOnce(() => mockChainMaybeSingle(contratoFirmado)) // 2. contrato
            .mockImplementationOnce(() => mockChainSingle(contactoBancario));    // 3. contacto

        mockTransferenciaRepository.verificarTransferenciaExistente.mockResolvedValue({
            id: 'transferencia-existente'
        });

        const result = await crearTransferencia.execute(datosTransferencia, usuarioOperador);

        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        expect(result.message).toBe('Ya existe una transferencia en proceso o completada para esta solicitud');
    });
});