// backend/tests/unit/infrastructure/repositories/mocks/repositoryMocks.js
// Mocks para repositorios y servicios
const mockUsuarioRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findInactiveByEmail: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    reactivate: jest.fn()
};

const mockSolicitanteRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findByUserId: jest.fn()
};

const mockOperadorRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findByUserId: jest.fn()
};

const mockEmailService = {
    enviarEmailConfirmacionCuenta: jest.fn(),
    enviarEmailBienvenida: jest.fn(),
    enviarEmailRecuperacionCuenta: jest.fn()
};

const mockSolicitudRepository = {
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    cambiarEstado: jest.fn(),
    asignarOperador: jest.fn()
};

const mockDocumentoRepository = {
    obtenerPorSolicitud: jest.fn(),
    verificarDocumentosObligatorios: jest.fn(),
    actualizar: jest.fn()
};

const mockFirmaDigitalRepository = {
    crear: jest.fn(),
    actualizar: jest.fn(),
    obtenerPorId: jest.fn(),
    verificarPermisos: jest.fn(),
    registrarAuditoria: jest.fn()
};

const mockContratoRepository = {
    obtenerPorSolicitud: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn()
};

const mockTransferenciaRepository = {
    crear: jest.fn(),
    obtenerPorId: jest.fn(),
    actualizarEstado: jest.fn(),
    verificarTransferenciaExistente: jest.fn(),
    verificarEstadoFirma: jest.fn()
};

const mockAuthService = {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    refreshSession: jest.fn(),
    updateUserPassword: jest.fn(),
    getUserById: jest.fn() // <-- FALTABA ESTE
};

const mockNotificacionService = {
    crearNotificacion: jest.fn(),
    notificarAprobacionSolicitud: jest.fn(),
    enviarNotificacionTiempoReal: jest.fn()
};

const mockWordService = {
    procesarFirmaAcumulativa: jest.fn(),
    subirDocumento: jest.fn(),
    verificarIntegridadCompleta: jest.fn()
};

const mockIntentoLoginRepository = {
    deleteOldFailures: jest.fn(),
    isBlocked: jest.fn(),
    registerAttempt: jest.fn(),
    countRecentFailures: jest.fn()
};

const mockNotificarFirmaSolicitanteCompletada = {
    execute: jest.fn()
};

const mockNotificarFirmaOperadorCompletada = {
    execute: jest.fn()
};

const mockNotificarFirmaCompletada = {
    execute: jest.fn()
};

const mockGenerarContratoUseCase = {
    execute: jest.fn()
};

const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
};

module.exports = {
    mockUsuarioRepository,
    mockSolicitanteRepository,
    mockOperadorRepository,
    mockEmailService,
    mockSolicitudRepository,
    mockDocumentoRepository,
    mockFirmaDigitalRepository,
    mockContratoRepository,
    mockTransferenciaRepository,
    mockAuthService,
    mockNotificacionService,
    mockWordService,
    mockIntentoLoginRepository,
    mockNotificarFirmaSolicitanteCompletada,
    mockNotificarFirmaOperadorCompletada,
    mockNotificarFirmaCompletada,
    mockGenerarContratoUseCase,
    mockSupabase
};