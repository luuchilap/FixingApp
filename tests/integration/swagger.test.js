/**
 * Integration test for Swagger UI
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Swagger UI', () => {
  test('should serve Swagger UI at /api-docs', async () => {
    const response = await request(app)
      .get('/api-docs/');

    expect([200, 301]).toContain(response.status);
    if (response.status === 200) {
      expect(response.text).toContain('swagger-ui');
    }
  });

  test('should serve Swagger JSON spec', async () => {
    // Swagger UI serves the spec at /api-docs/swagger.json
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    expect(response.body).toHaveProperty('openapi');
    expect(response.body.openapi).toBe('3.0.0');
    expect(response.body).toHaveProperty('info');
    expect(response.body.info.title).toBe('FixingApp Backend API');
  });

  test('should have health endpoint documented', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json');

    expect(response.status).toBe(200);
    expect(response.body.paths).toHaveProperty('/health');
    expect(response.body.paths['/health']).toHaveProperty('get');
  });

  test('should have Bearer auth security scheme', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json');

    expect(response.status).toBe(200);
    expect(response.body.components.securitySchemes).toHaveProperty('bearerAuth');
    expect(response.body.components.securitySchemes.bearerAuth.type).toBe('http');
    expect(response.body.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
  });
});

