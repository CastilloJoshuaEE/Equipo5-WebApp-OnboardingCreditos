// backend/tests/integration/solicitudes/solicitudes.integration.test.js
const { setupTestServer, teardownTestServer } = require('../../helpers/testServer');
describe('Solicitudes Integration Tests', ()=>{
    let request;
    let server;
    let testToken;
    let testUserId;
    let testSolicitudId;
    beforeAll(async()=>{
        const setup = await setupTestServer();
        request = setup.app;
        server = setup.server;
        testToken = setup.testToken;
        testUserId = setup.testUserId;
    });
    afterAll(async ()=>{
        await teardownTestServer();
    });
    describe('POST /api/solicitudes', ()=>{
        test('Debe crear solicitud en borrador', async()=>{
            const solicitudData = {
                monto: 150000,
                plazo_meses: 24,
                proposito: 'Expansión de negocio - compra de maquinaria',
                moneda: 'USD'
            };
            const response = await request
                .post('/api/solicitudes')
                .set('Authorization', `Bearer ${testToken}`)
                .send(solicitudData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.estado).toBe('borrador');
            expect(response.body.data.monto).toBe(150000);
            expect(response.body.data.solicitante_id).toBe(testUserId);
            testSolicitudId = response.body.data.id;
        });
        test('Debe fallar si monto es negativo', async()=>{
            const solicitudData = {
                monto: -1000,
                plazo_meses: 12,
                proposito: 'Test'
            };
            const response = await request 
                .post('/api/solicitudes')
                .set('Authorization', `Bearer ${testToken}`)
                .send(solicitudData)
                .expect(400);
            expect(response.body.success).toBe(false);    
        });
        test('Debe fallar si propósito es muy corto', async()=>{
            const solicitudData = {
                monto: 1000,
                plazo_meses: 12,
                proposito: 'corto'
            };
            const response = await request 
                .post('/api/solicitudes')
                .set('Authorization', `Bearer ${testToken}`)
                .send(solicitudData)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('al menos 10 caracteres');
        });
        test('Debe fallar sin autenticación', async()=>{
            const solicitudData = {
                monto: 1000,
                plazo_meses: 12,
                proposito: 'Propósito válido para prueba'
            };
            const response = await request
                .post('/api/solicitudes')
                .send(solicitudData)
                .expect(401);
            expect(response.body.success).toBe(false);
        });


    });
    describe('GET /api/solicitudes',()=>{
        test('Debe obtener mis solicitudes', async()=>{
            const response = await request
                .get('/api/solicitudes')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
        test('Debe obtener detalle de solicitud específica', async()=>{
            const response = await request
                .get(`/api/solicitudes/${testSolicitudId}`)
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testSolicitudId);
        });
        test('Debe fallar para solicitud inexistente', async()=>{
            const response = await request
                .get('/api/solicitudes/123e4567-e89b-12d3-a456-426614174999')
                .set('Authorization', `Bearer ${testToken}`)
                .expect(500);
            expect(response.body.success).toBe(false);
        });
    });
    describe('PUT /api/solicitudes/:solicitud_id/enviar',()=>{
        test('Debe fallar al enviar sin documentos', async()=>{
            const response = await request
                .put(`/api/solicitudes/${testSolicitudId}/enviar`)
                .set('Authorization', `Bearer ${testToken}`)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Documentos obligatorios faltantes');
        });
    });
    describe('DELETE /api/solicitudes/:solicitud_id',()=>{
        test('Debe eliminar solicitud en borrador', async()=>{
            const response = await request
                .delete(`/api/solicitudes/${testSolicitudId}`)
                .set('Authorization', `Bearer ${testToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Solicitud eliminada exitosamente');
        });
    });

});