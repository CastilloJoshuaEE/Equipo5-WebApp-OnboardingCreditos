// backend/tests/unit/application/auth/LoginUsuario.test.js
const LoginUsuario = require('../../../../application/use-cases/auth/LoginUsuario');
const { mockUsuarioRepository,
    mockIntentoLoginRepository,
    mockAuthService
} = require('../../infrastructure/repositories/mocks/repositoryMocks');
describe('LoginUsuario Use Case', ()=>{
    let loginUsuario;
    beforeEach(()=>{
        jest.clearAllMocks();
        loginUsuario = new LoginUsuario(
            mockUsuarioRepository,
            mockIntentoLoginRepository,
            mockAuthService
        );
    });
    const credenciales = {
        email: 'test@example.com',
        password: 'Test1234',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
    };
    test('Debe iniciar sesión exitosamente', async()=>{
        mockIntentoLoginRepository.deleteOldFailures.mockResolvedValue(true);
        mockIntentoLoginRepository.isBlocked.mockResolvedValue({bloqueado: false});
        mockUsuarioRepository.findByEmail.mockResolvedValue({
            id: 'user-123',
            email: 'test@example.com',
            cuenta_activa: true
        });
        mockAuthService.signInWithPassword.mockResolvedValue({
            success: true,
            data: {
                user: {id: 'auth-123'},
                session: {access_token: 'token'}
            }
        });
        mockIntentoLoginRepository.registerAttempt.mockResolvedValue(true);
        mockUsuarioRepository.findById.mockResolvedValue({
            id: 'auth-123',
            email: 'test@example.com'
        });
        const result = await loginUsuario.execute(credenciales);
        expect(result.success).toBe(true);
        expect(result.message).toBe('Login exitoso');
        expect(result.data).toBeDefined();
    });
    test('Debe fallar si email o password faltan', async()=>{
        const result = await loginUsuario.execute({email: 'test@example.com'});
        expect(result.success).toBe(false);
        expect(result.status).toBe(400);
        expect(result.message).toBe('Email y contraseña son requeridos');
    });
    test('Debe fallar si email no existe', async()=>{
        mockIntentoLoginRepository.deleteOldFailures.mockResolvedValue(true);
        mockIntentoLoginRepository.isBlocked.mockResolvedValue({bloqueado: false});
        mockUsuarioRepository.findByEmail.mockResolvedValue(null);
        mockIntentoLoginRepository.registerAttempt.mockResolvedValue(true);
        const result = await loginUsuario.execute(credenciales);
        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
        expect(result.message).toBe('No hay una cuenta registrada con este email. Por favor regístrese primero.');
    });
    test('Debe bloquear cuenta después de 5 intentos fallidos', async()=>{
        mockIntentoLoginRepository.deleteOldFailures.mockResolvedValue(true);
        mockIntentoLoginRepository.isBlocked.mockResolvedValue({
            bloqueado:true,
            minutosRestantes: 15
        });
        mockIntentoLoginRepository.registerAttempt.mockResolvedValue(true);
        const result = await loginUsuario.execute(credenciales);
        expect(result.success).toBe(false);
        expect(result.status).toBe(429);
        expect(result.message).toContain('Cuenta temporalmente bloqueada');
    });
    test('Debe registrar intentos fallidos', async()=>{
        mockIntentoLoginRepository.deleteOldFailures.mockResolvedValue(true);
        mockIntentoLoginRepository.isBlocked.mockResolvedValue({bloqueado: false});
        mockUsuarioRepository.findByEmail.mockResolvedValue({
            id: 'user-123',
            email:'test@example.com',
            cuenta_activa: true
        });
        mockAuthService.signInWithPassword.mockResolvedValue({
            success: false,
            error: { message: 'Invalid login credentials'}
        });
        mockIntentoLoginRepository.registerAttempt.mockResolvedValue(true);
        mockIntentoLoginRepository.countRecentFailures.mockResolvedValue(3);
        const result = await loginUsuario.execute(credenciales);
        expect(result.success).toBe(false);
        expect(result.status).toBe(401);
        expect(mockIntentoLoginRepository.registerAttempt).toHaveBeenCalled();
    });
});
