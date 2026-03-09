// backend/tests/unit/application/solicitudes/AprobarSolicitud.test.js
const AprobarSolicitud = require('../../../../application/use-cases/solicitudes/AprobarSolicitud');
const {
    mockSolicitudRepository,
    mockNotificacionService,
    mockGenerarContratoUseCase
} = require('../../infrastructure/repositories/mocks/repositoryMocks');
describe('AprobarSolicitud Use Case',()=>{
    let aprobarSolicitud;
    beforeEach(()=>{
        jest.clearAllMocks();
        aprobarSolicitud = new AprobarSolicitud(
            mockSolicitudRepository,
            mockNotificacionService,
            mockGenerarContratoUseCase
        );
    });
    const usuarioOperador = {
        id: 'operador-123',
        rol: 'operador'
    };
    const solicitudEnRevision = {
        id: 'solicitud-123',
        estado: 'en_revision',
        solicitante_id: 'solicitante-123'
    };
    test('Debe aprobar solicitud exitosamente', async()=>{
        mockSolicitudRepository.findById.mockResolvedValue(solicitudEnRevision);
        mockSolicitudRepository.cambiarEstado.mockResolvedValue({
            ...solicitudEnRevision,
            estado: 'aprobado'
        });
        mockGenerarContratoUseCase.execute.mockResolvedValue({
            id: 'contrato-123'
        });
        mockNotificacionService.notificarAprobacionSolicitud.mockResolvedValue(true);
        const result = await aprobarSolicitud.execute(
            'solicitud-123',
            { comentarios: 'Solicitud aprobada'},
            usuarioOperador
        );
        expect(result.success).toBe(true);
        expect(result.message).toContain('Solicitud aprobada exitosamente');
        expect(mockSolicitudRepository.cambiarEstado).toHaveBeenCalledWith(
            'solicitud-123',
            'aprobado',
            expect.any(Object)
        );
        expect(mockGenerarContratoUseCase.execute).toHaveBeenCalledWith('solicitud-123');
    });
    test('Debe fallar si usuario no es operador', async()=>{
        const usuarioSolicitante = { id: 'user-123', rol:'solicitante'};
        const result = await aprobarSolicitud.execute('solicitud-123', {}, usuarioSolicitante);
        expect(result.success).toBe(false);
        expect(result.status).toBe(403);
        expect(result.message).toBe('Solo los operadores pueden aprobar solicitudes');
    });
    test('Debe fallar si solicitud no está en estado válido', async()=>{
        const solicitudBorrador = {
            ...solicitudEnRevision, estado: 'borrador'
        };
        mockSolicitudRepository.findById.mockResolvedValue(solicitudBorrador);
        const result = await aprobarSolicitud.execute(
            'solicitud-123',
            { comentarios: 'Aprobar'},
            usuarioOperador
        );
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        expect(result.message).toBe('La solicitud no está en estado válido para aprobación');
    });
    test('Debe continuar aunque falle generación de contrato', async()=>{
        mockSolicitudRepository.findById.mockResolvedValue(solicitudEnRevision);
        mockSolicitudRepository.cambiarEstado.mockResolvedValue({
            ...solicitudEnRevision,
            estado: 'aprobado'
        });
        mockGenerarContratoUseCase.execute.mockRejectedValue(new Error('Error generando contrato'));
        const result = await aprobarSolicitud.execute('solicitud-123',
            {comentarios: 'Aprobar'},
            usuarioOperador
        );
        expect(result.success).toBe(true);
expect(mockNotificacionService.notificarAprobacionSolicitud).toHaveBeenCalled();
    });
});