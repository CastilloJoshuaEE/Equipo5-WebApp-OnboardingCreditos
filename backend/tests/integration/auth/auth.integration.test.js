// backend/tests/integration/auth/auth.integration.test.js
const {setupTestServer, teardownTestServer} = require('../../helpers/testServer');
describe('Auth Integration tests',()=>{
    let request;
    let server;
    let testToken;
    beforeAll(async()=>{
        const setup = await setupTestServer();
        request= setup.app;
        server = setup.server;
        testToken = setup.testToken;
    });
    afterAll(async()=>{
        await teardownTestServer();
    });
    describe('POST /api/usuarios/registro',()=>{
        test('Debe registrar un solicitante exitosamente', async()=>{
            const usuarioData = {
                email: 'nuevo@example.com',
                password: 'Test1234',
                nombre_completo: 'Nuevo Usuario',
                telefono: '+5491112345678',
                dni: '87654321',
                rol: 'solicitante',
                nombre_empresa: 'Nueva SA',
                cuit:'30-87654321-8',
                representante_legal: 'Nuevo Usuario',
                domicilio: 'Calle Nueva 456'
            };
            const response = await request
                .post('/api/usuarios/registro')
                .send(usuarioData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Usuario registrado correctamente. Por favor revisa tu email para confirmar tu cuenta');
            expect(response.body.data.user.email).toBe('nuevo@example.com');
        });
        test('Debe fallar si email ya existe', async()=>{
            const usuarioData = {
                email: 'test@example.com',
                password: 'Test1234',
                nombre_completo: 'Usuario Duplicado',
                telefono: '+5491112345678',
                dni: '12345678',
                rol: 'solicitante'
            };
            const response = await request 
                .post('/api/usuarios/registro')
                .send(usuarioData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Ya existe una cuenta activa con este email');
        });
        test('Debe validar campos requeridos', async()=>{
            const response = await request
                .post('/api/usuarios/registro')
                .send({email:'nuevo-test@example.com'})
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });
    describe('POST /api/usuarios/login', ()=>{
        test('Debe iniciar sesión sesión exitosamente', async()=>{
            const credenciales = {
                email: 'test@example.com',
                password: 'Test1234'
            };
            const response = await request 
                .post('/api/usuarios/login')
                .send(credenciales)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.session).toBeDefined();
            expect(response.body.data.profile.email).toBe('test@example.com');
        });
        test('Debe fallar credenciales inválidas', async()=>{
            const credenciales = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };
            const response = await request
                .post('/api/usuarios/login')
                .send(credenciales)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email o contraseña incorrectos');
        });
        test('Debe fallar con email no registrado', async()=>{
            const credenciales = {
                email: 'noexiste@example.com',
                password: 'Test1234'
            };
            const response = await request
                .post('/api/usuarios/login')
                .send(credenciales)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('No hay una cuenta registrada con este email. Por favor registrese primero.');
        });
    });
    describe('GET /api/usuarios/session', ()=>{
        test('Debe obtener sesióna activa', async()=>{
            const response = await request
                .get('/api/usuarios/session')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.profile).toBeDefined();
        });
        test('Debe fallar sin token', async()=>{
            const response = await request
                .get('/api/usuarios/session')
                .expect(401);
            expect(response.body.success).toBe(false);
        });
    });
});