// backend/tests/integration/firmas/firmas.integration.test.js
const { setupTestServer, teardownTestServer } = require('../../helpers/testServer');

describe('Firmas Integration Tests', () => {
  let request;
  let server;
  let testToken;

  beforeAll(async () => {
    const setup = await setupTestServer();
    request = setup.app;
    server = setup.server;
    testToken = setup.testToken;
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  describe('POST /api/firmas/iniciar-proceso/:solicitud_id', () => {
    test(' Debe fallar si solicitud no está aprobada', async () => {
      const response = await request
        .post('/api/firmas/iniciar-proceso/123e4567-e89b-12d3-a456-426614174000')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Solicitud no encontrada o no aprobada');
    });
  });

  describe('GET /api/firmas/pendientes', () => {
    test(' Debe obtener firmas pendientes (puede estar vacío)', async () => {
      const response = await request
        .get('/api/firmas/pendientes')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});