// backend/tests/unit/application/firmas/ProcesarFirma.test.js
const ProcesarFirma = require('../../../../application/use-cases/firmas/ProcesarFirma');
const { 
    mockFirmaDigitalRepository,
    mockWordService,
    mockNotificacionService,
    mockNotificarFirmaSolicitanteCompletada,
    mockNotificarFirmaOperadorCompletada,
    mockNotificarFirmaCompletada
} = require('../../infrastructure/repositories/mocks/repositoryMocks');
describe('ProcesarFirma Use Case', ()=>{
    let procesarFirma;
    beforeEach(()=>{
        jest.clearAllMocks();
        procesarFirma = new ProcesarFirma(
            mockFirmaDigitalRepository,
            mockWordService,
            mockNotificacionService,
            mockNotificarFirmaSolicitanteCompletada,
            mockNotificarFirmaOperadorCompletada,
            mockNotificarFirmaCompletada
        );
    });
    const usuarioSolicitante = {
        id: 'user-123',
        nombre_completo: 'Test Solicitante',
        rol:'solicitante',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
    };
    const usuarioOperador = {
        id: 'user-456',
        nombre_completo: 'Test Operador',
        rol: 'operador',
        ip: '192.168.1.2',
        userAgent: 'Mozilla/5.0'
    };
    const firmaData = {
        firma_data: {
            ubicacion: 'Buenos Aires',
            firmaTexto: 'Firma digital',
            tipo_firma: 'texto'
        },
        tipo_firma: 'solicitante'
    };
    test('Debe procesar firma del solicitante exitosamente', async()=>{
        const firmaActual = {
            id: 'firma-123',
            estado: 'enviado',
            contrato_id: 'contrato-123',
            hash_documento_original: 'hash123',
            fecha_firma_solicitante: null
        };
        mockFirmaDigitalRepository.verificarPermisos.mockResolvedValue(true);
        mockFirmaDigitalRepository.obtenerPorId.mockResolvedValue(firmaActual);
        mockWordService.procesarFirmaAcumulativa.mockResolvedValue({
            success: true,
            hash: 'nuevo-hash',
            ruta: 'contratos-firmados/123.docx'
        });
        mockWordService.verificarIntegridadCompleta.mockResolvedValue(false);
        mockFirmaDigitalRepository.actualizar.mockResolvedValue({
            ...firmaActual,
            fecha_firma_solicitante: new Date().toISOString(),
            estado: 'firmado_solicitante'
        });
        mockFirmaDigitalRepository.registrarAuditoria.mockResolvedValue(true);
        const result=await procesarFirma.execute('firma-123', firmaData, usuarioSolicitante);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Firma procesada exitosamente');
        expect(result.data.estado).toBe('firmado_solicitante');
        expect(mockNotificarFirmaSolicitanteCompletada.execute).toHaveBeenCalled();

    });
    test('Debe procesar firma del operador y completar proceso', async()=>{
        const firmaActual = {
            id: 'firma-123',
            estado: 'firmado_solicitante',
            contrato_id: 'contrato-123',
            solicitud_id: 'solicitud-123',
            hash_documento_original: 'hash123',
            fecha_firma_solicitante: new Date().toISOString(),
            fecha_firma_operador: null
        };
        mockFirmaDigitalRepository.verificarPermisos.mockResolvedValue(true);
        mockFirmaDigitalRepository.obtenerPorId.mockResolvedValue(firmaActual);
        mockWordService.procesarFirmaAcumulativa.mockResolvedValue({
            success: true,
            hash: 'nuevo-hash',
            ruta: 'contratos-firmados/123.docx'
        });
        mockWordService.verificarIntegridadCompleta.mockResolvedValue(true);
        mockFirmaDigitalRepository.actualizar.mockResolvedValue({
            ...firmaActual,
            fecha_firma_operador: new Date().toISOString(),
            estado: 'firmado_completo',
            integridad_valida: true
        });
        mockFirmaDigitalRepository.registrarAuditoria.mockResolvedValue(true);
        const result = await procesarFirma.execute(
            'firma-123',
            {...firmaData, tipo_firma: 'operador'},
            usuarioOperador
        );
        expect(result.success).toBe(true);
        expect(result.message).toContain('CONTRATO COMPLETAMENTE FIRMADO');
        expect(result.data.estado).toBe('firmado_completo');
        expect(result.data.integridad_valida).toBe(true);
        expect(mockNotificarFirmaCompletada.execute).toHaveBeenCalled();
    });
    test('Debe fallar si no tiene permisos', async()=>{
        mockFirmaDigitalRepository.verificarPermisos.mockResolvedValue(false);
        const result = await procesarFirma.execute('firma-123', firmaData, usuarioSolicitante);
        expect(result.success).toBe(false);
        expect(result.status).toBe(403);
        expect(result.message).toBe('No tiene permisos para firmar este contrato');
    });
    test('ebe fallar si faltan datos de firma', async()=>{
        const result = await procesarFirma.execute('firma-123', {}, usuarioSolicitante);
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        expect(result.message).toBe('Datos de firma y tipo son requeridos');
    });
    test('Debe fallar si firma no existe', async()=>{
        mockFirmaDigitalRepository.verificarPermisos.mockResolvedValue(true);
        mockFirmaDigitalRepository.obtenerPorId.mockResolvedValue(null);
        const result = await procesarFirma.execute('firma-123', firmaData, usuarioSolicitante);
        expect(result.success).toBe(false);
        expect(result.status).toBe(404);
        expect(result.message).toBe('Proceso de firma no encontrado');
    });
});