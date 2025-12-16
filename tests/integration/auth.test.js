/**
 * Integration tests for Authentication module
 * Tests: Register Employer, Register Worker, Login, Logout
 */

const request = require('supertest');
const { initTestDatabase, cleanupTestDatabase } = require('../setup');
const { createTestUser } = require('../helpers');

const path = require('path');
const { TEST_DB_PATH } = require('../setup');

// Set test environment and database path
process.env.NODE_ENV = 'test';
process.env.DB_PATH = TEST_DB_PATH;

// Initialize test database BEFORE loading app (so app uses test DB)
const db = initTestDatabase();

// Now load app - it will use the test database
const app = require('../../src/app');

afterAll(() => {
  cleanupTestDatabase();
  if (db) db.close();
});

describe('POST /api/auth/register-employer', () => {
  test('should register a new employer successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register-employer')
      .send({
        phone: '0123456789',
        password: 'password123',
        fullName: 'John Employer',
        address: '123 Main St'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.role).toBe('EMPLOYER');
  });

  test('should reject duplicate phone number', async () => {
    // Create first employer
    await createTestUser(db, {
      phone: '0987654321',
      roleName: 'EMPLOYER'
    });

    // Try to register with same phone
    const response = await request(app)
      .post('/api/auth/register-employer')
      .send({
        phone: '0987654321',
        password: 'password123',
        fullName: 'Another Employer',
        address: '456 Main St'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register-employer')
      .send({
        phone: '0123456789'
        // Missing password, fullName
      });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/register-worker', () => {
  beforeEach(() => {
    // Clean up any existing users with these phone numbers
    db.prepare('DELETE FROM users WHERE phone IN (?, ?, ?)').run('0111222333', '0222333444', '0333444555');
  });

  test('should register a new worker successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register-worker')
      .send({
        phone: '0111222333',
        password: 'password123',
        fullName: 'Jane Worker',
        address: '789 Worker St',
        skill: 'Plumbing'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.role).toBe('WORKER');
  });

  test('should create worker profile with skill', async () => {
    const response = await request(app)
      .post('/api/auth/register-worker')
      .send({
        phone: '0222333444',
        password: 'password123',
        fullName: 'Bob Worker',
        address: '321 Worker Ave',
        skill: 'Electrical'
      });

    expect(response.status).toBe(201);
    // Verify worker profile was created
    const workerProfile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(response.body.user.id);
    expect(workerProfile).toBeDefined();
    expect(workerProfile.skill).toBe('Electrical');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    // Clean up existing users first
    db.prepare('DELETE FROM users WHERE phone IN (?, ?, ?, ?)').run('0333444555', '0444555666', '0999999999', '0555666777');
    
    // Create test users
    createTestUser(db, {
      phone: '0333444555',
      password: 'password123',
      roleName: 'EMPLOYER'
    });
    createTestUser(db, {
      phone: '0444555666',
      password: 'workerpass',
      roleName: 'WORKER'
    });
  });

  test('should login employer successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '0333444555',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.role).toBe('EMPLOYER');
  });

  test('should login worker successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '0444555666',
        password: 'workerpass'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.role).toBe('WORKER');
  });

  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '0333444555',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  test('should reject non-existent user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '0999999999',
        password: 'password123'
      });

    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    // Clean up existing users
    db.prepare('DELETE FROM users WHERE phone = ?').run('0555666777');
  });

  test('should logout successfully (if token invalidation is implemented)', async () => {
    const employer = createTestUser(db, {
      phone: '0555666777',
      roleName: 'EMPLOYER'
    });

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${employer.token}`);

    // Logout returns 200 (token invalidation optional in MVP)
    expect(response.status).toBe(200);
  });
});

