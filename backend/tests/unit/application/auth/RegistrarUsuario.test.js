// backend/tests/unit/application/auth/RegistrarUsuario.test.js
const RegistrarUsuario = require('../../../../application/use-cases/auth/RegistrarUsuario');
const { 
  mockUsuarioRepository,
  mockSolicitanteRepository,
  mockOperadorRepository,
  mockAuthService,
  mockEmailService
} = require('../../infrastructure/repositories/mocks/repositoryMocks');

describe('RegistrarUsuario Use Case', () => {
  let registrarUsuario;

  beforeEach(() => {
    jest.clearAllMocks();
    registrarUsuario = new RegistrarUsuario(
      mockUsuarioRepository,
      mockSolicitanteRepository,
      mockOperadorRepository,
      mockAuthService,
      mockEmailService
    );
  });

  const datosSolicitante = {
    email: 'test@example.com',
    password: 'Test1234',
    nombre_completo: 'Test User',
    telefono: '+5491112345678',
    dni: '12345678',
    rol: 'solicitante',
    nombre_empresa: 'Test SA',
    cuit: '30-12345678-9',
    representante_legal: 'Test User',
    domicilio: 'Calle Test 123'
  };

  test('Debe registrar un solicitante exitosamente', async () => {
    mockUsuarioRepository.findInactiveByEmail.mockResolvedValue(null);
    mockUsuarioRepository.exists.mockResolvedValue(false);
    mockAuthService.signUp.mockResolvedValue({ 
      success: true, 
      data: { user: { id: 'auth-123', email: 'test@example.com' } } 
    });
    mockUsuarioRepository.create.mockResolvedValue({ id: 'user-123', ...datosSolicitante });
    mockSolicitanteRepository.create.mockResolvedValue({ id: 'user-123' });
    mockEmailService.enviarEmailConfirmacionCuenta.mockResolvedValue({ success: true });

    const result = await registrarUsuario.execute(datosSolicitante);

    expect(result.success).toBe(true);
    expect(result.status).toBe(201);
    expect(mockUsuarioRepository.create).toHaveBeenCalled();
    expect(mockSolicitanteRepository.create).toHaveBeenCalled();
    expect(mockEmailService.enviarEmailConfirmacionCuenta).toHaveBeenCalled();
  });

  test('Debe fallar si faltan campos requeridos', async () => {
    const datosInvalidos = { email: 'test@example.com', password: 'Test1234' };

    const result = await registrarUsuario.execute(datosInvalidos);

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.errors).toContain('Nombre completo es requerido');
  });

  test('Debe fallar si email ya existe activo', async () => {
    mockUsuarioRepository.findInactiveByEmail.mockResolvedValue(null);
    mockUsuarioRepository.exists.mockResolvedValue(true);

    const result = await registrarUsuario.execute(datosSolicitante);

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.message).toBe('Ya existe una cuenta activa con este email');
  });

  test('Debe reactivar usuario inactivo', async () => {
    const usuarioInactivo = { id: 'user-123', cuenta_activa: false };
    mockUsuarioRepository.findInactiveByEmail.mockResolvedValue(usuarioInactivo);
    mockUsuarioRepository.update.mockResolvedValue({ ...usuarioInactivo, cuenta_activa: true });
    mockAuthService.getUserById.mockResolvedValue({ id: 'auth-123', email: 'test@example.com' });
    mockEmailService.enviarEmailBienvenida.mockResolvedValue({ success: true });

    const result = await registrarUsuario.execute(datosSolicitante);

    expect(result.success).toBe(true);
    expect(result.status).toBe(200);
    expect(result.message).toBe('Usuario reactivado correctamente');
    expect(mockUsuarioRepository.update).toHaveBeenCalled();
  });
});