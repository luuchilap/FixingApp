/**
 * Integration test for health check endpoint
 */

const request = require('supertest');
const app = require('../../src/app');

describe('GET /health', () => {
  test('should return 200 status code', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
  });

  test('should return health status object', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(typeof response.body.uptime).toBe('number');
  });

  test('should return valid ISO timestamp', async () => {
    const response = await request(app)
      .get('/health');

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp.toISOString()).toBe(response.body.timestamp);
  });
});

describe('Error handling', () => {
  test('should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });
});

