/**
 * Integration tests for User module
 * Tests: Get current user, Update current user
 */

const request = require('supertest');
const { initTestDatabase, cleanupTestDatabase } = require('../setup');
const { createTestUser } = require('../helpers');

const path = require('path');
const { TEST_DB_PATH } = require('../setup');

// Set test environment and database path
process.env.NODE_ENV = 'test';
process.env.DB_PATH = TEST_DB_PATH;

// Initialize test database BEFORE loading app
const db = initTestDatabase();

// Now load app - it will use the test database
const app = require('../../src/app');

afterAll(() => {
  cleanupTestDatabase();
  if (db) db.close();
});

describe('GET /api/users/me', () => {
  test('should return current user profile', async () => {
    const employer = createTestUser(db, {
      phone: '0111111111',
      roleName: 'EMPLOYER'
    });

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe(employer.id);
    expect(response.body).toHaveProperty('phone');
    expect(response.body).toHaveProperty('fullName');
    expect(response.body).toHaveProperty('role');
    expect(response.body.role).toBe('EMPLOYER');
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/api/users/me');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  test('should return worker profile', async () => {
    const worker = createTestUser(db, {
      phone: '0222222222',
      roleName: 'WORKER',
      skill: 'Plumbing'
    });

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${worker.token}`);

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('WORKER');
  });
});

describe('PUT /api/users/me', () => {
  test('should update user profile', async () => {
    const employer = createTestUser(db, {
      phone: '0333333333',
      roleName: 'EMPLOYER'
    });

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        fullName: 'Updated Name',
        address: 'Updated Address'
      });

    expect(response.status).toBe(200);
    expect(response.body.fullName).toBe('Updated Name');
    expect(response.body.address).toBe('Updated Address');
    expect(response.body).toHaveProperty('updatedAt');
  });

  test('should update only fullName', async () => {
    const employer = createTestUser(db, {
      phone: '0444444444',
      roleName: 'EMPLOYER',
      address: 'Original Address'
    });

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        fullName: 'New Name'
      });

    expect(response.status).toBe(200);
    expect(response.body.fullName).toBe('New Name');
    expect(response.body.address).toBe('Original Address');
  });

  test('should update only address', async () => {
    const employer = createTestUser(db, {
      phone: '0555555555',
      roleName: 'EMPLOYER',
      fullName: 'Original Name'
    });

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        address: 'New Address'
      });

    expect(response.status).toBe(200);
    expect(response.body.fullName).toBe('Original Name');
    expect(response.body.address).toBe('New Address');
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .put('/api/users/me')
      .send({
        fullName: 'Test'
      });

    expect(response.status).toBe(401);
  });

  test('should reject empty update', async () => {
    const employer = createTestUser(db, {
      phone: '0666666666',
      roleName: 'EMPLOYER'
    });

    const response = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

