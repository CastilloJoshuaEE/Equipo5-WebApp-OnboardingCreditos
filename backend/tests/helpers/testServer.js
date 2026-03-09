// backend/tests/helpers/testServer.js
const request = require('supertest');
const express = require('express');

let app;
let server;
let testToken;
let testUserId;

const setupTestServer = async () => {
    await cleanupTestData();

    app = express();
    app.use(express.json());
    
    const dependencies = await createTestDependencies();
    
    const routes = require('../../interfaces/routes/index');
    app.use('/api', routes(dependencies));

    server = app.listen(0); // Puerto aleatorio

    testUserId = 'test-user-id';
    testToken = 'test-token';

    return { app: request(app), server, testToken, testUserId };
};

const cleanupTestData = async () => {
    return Promise.resolve();
};

const createTestDependencies = async () => {
    const emailValidator = {
        verifyEmailOnly: (req, res, next) => {
            req.emailValidation = {
                email: req.body.email,
                isValid: true,
                confidence: 0.95,
                servicesUsed: 1,
                details: [{ valid: true, service: 'Mock', reason: 'Email válido (mock)' }]
            };
            next();
        },
        validateEmailBeforeAuth: (req, res, next) => {
            next();
        }
    };

    const firmaDigitalController = {
        iniciarProcesoFirma: (req, res) => {
            return res.status(404).json({ 
                success: false, 
                message: 'Solicitud no encontrada o no aprobada' 
            });
        },
        obtenerFirmasPendientes: (req, res) => {
            return res.status(200).json({ 
                success: true, 
                data: [] 
            });
        }
    };

    const authController = {
        registrar: (req, res) => {
            const errors = [];
            
            // Validar email duplicado
            if (req.body.email === 'test@example.com') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Ya existe una cuenta activa con este email' 
                });
            }
            
            // Validar campos requeridos básicos
            if (!req.body.nombre_completo) {
                errors.push('Nombre completo es requerido');
            }
            if (!req.body.telefono) {
                errors.push('Teléfono es requerido');
            }
            if (!req.body.dni) {
                errors.push('DNI es requerido');
            }
            if (!req.body.password) {
                errors.push('Contraseña es requerida');
            }
            
            // Validar campos específicos para solicitantes
            if (req.body.rol === 'solicitante') {
                if (!req.body.nombre_empresa) {
                    errors.push('Nombre de empresa es requerido');
                }
                if (!req.body.cuit) {
                    errors.push('CUIT es requerido');
                }
                if (!req.body.representante_legal) {
                    errors.push('Representante legal es requerido');
                }
                if (!req.body.domicilio) {
                    errors.push('Domicilio es requerido');
                }
            }
            
            if (errors.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    errors: errors
                });
            }
                // DESPUÉS VALIDAR EMAIL DUPLICADO
    if (req.body.email === 'test@example.com') {
        return res.status(400).json({
            success: false,
            message: 'Ya existe una cuenta activa con este email'
        });
    }

            return res.status(201).json({ 
                success: true, 
                message: 'Usuario registrado correctamente. Por favor revisa tu email para confirmar tu cuenta',
                data: { user: { email: req.body.email } }
            });
        },
        login: (req, res) => {
            const { email, password } = req.body;
            if (email === 'test@example.com' && password === 'Test1234') {
                return res.status(200).json({ 
                    success: true, 
                    data: { 
                        session: { access_token: 'test-token' },
                        profile: { email: 'test@example.com' }
                    } 
                });
            }
            if (email === 'test@example.com') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Email o contraseña incorrectos' 
                });
            }
            return res.status(401).json({ 
                success: false, 
                message: 'No hay una cuenta registrada con este email. Por favor registrese primero.' 
            });
        },
        getSession: (req, res) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false });
            }
            return res.status(200).json({ 
                success: true, 
                data: { 
                    user: { id: 'test-user-id' },
                    profile: { email: 'test@example.com' }
                } 
            });
        }
    };

    const solicitudesController = {
        crearSolicitud: (req, res) => {
            const { monto, plazo_meses, proposito } = req.body;
            
            if (!req.usuario) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }
            
            if (monto < 0) {
                return res.status(400).json({ success: false });
            }
            
            if (proposito && proposito.length < 10) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Propósito debe tener al menos 10 caracteres' 
                });
            }
            
            return res.status(201).json({ 
                success: true, 
                data: { 
                    id: 'solicitud-123',
                    estado: 'borrador',
                    monto: monto,
                    solicitante_id: req.usuario.id
                } 
            });
        },
        obtenerMisSolicitudes: (req, res) => {
            if (!req.usuario) {
                return res.status(401).json({ success: false });
            }
            return res.status(200).json({ 
                success: true, 
                data: [{ id: 'solicitud-123', estado: 'borrador' }] 
            });
        },
        obtenerSolicitudDetalle: (req, res) => {
            const { solicitud_id } = req.params;
            if (!req.usuario) {
                return res.status(401).json({ success: false });
            }
            if (solicitud_id === 'solicitud-123') {
                return res.status(200).json({ 
                    success: true, 
                    data: { id: 'solicitud-123' } 
                });
            }
            return res.status(500).json({ 
                success: false, 
                message: 'Error' 
            });
        },
        enviarSolicitud: (req, res) => {
            if (!req.usuario) {
                return res.status(401).json({ success: false });
            }
            return res.status(400).json({ 
                success: false, 
                message: 'Documentos obligatorios faltantes' 
            });
        },
        eliminarSolicitud: (req, res) => {
            if (!req.usuario) {
                return res.status(401).json({ success: false });
            }
            return res.status(200).json({ 
                success: true, 
                message: 'Solicitud eliminada exitosamente' 
            });
        }
    };

    const mockMiddleware = {
        proteger: (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, message: 'No autorizado' });
            }
            req.usuario = { id: 'test-user-id', rol: 'solicitante' };
            next();
        },
        autorizar: () => (req, res, next) => next()
    };

    return {
        authController,
        usuarioController: authController,
        solicitudesController,
        firmaDigitalController,
        authMiddleware: mockMiddleware,
        uploadMiddleware: { single: () => (req, res, next) => next() },
        emailValidator
    };
};

const teardownTestServer = async () => {
    if (server) {
        await new Promise(resolve => server.close(resolve));
    }
};

module.exports = {
    setupTestServer,
    teardownTestServer,
    getTestToken: () => testToken,
    getTestUserId: () => testUserId
};