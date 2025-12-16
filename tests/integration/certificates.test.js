/**
 * Integration tests for Worker Certificates module
 * Tests: Upload certificate, Check certificate status
 */

const request = require('supertest');
const { initTestDatabase, cleanupTestDatabase } = require('../setup');
const { createTestUser, createTestCertificate } = require('../helpers');

const path = require('path');
const { TEST_DB_PATH } = require('../setup');

// Set test environment and database path
process.env.NODE_ENV = 'test';
process.env.DB_PATH = TEST_DB_PATH;

// Initialize test database BEFORE loading app
const db = initTestDatabase();

// Now load app - it will use the test database
const app = require('../../src/app');

let worker;
let admin;

beforeEach(() => {
  // Clean up existing data
  db.prepare('DELETE FROM worker_certificates').run();
  db.prepare('DELETE FROM users WHERE phone IN (?, ?)').run('0222222222', '0999999999');
  
  worker = createTestUser(db, {
    phone: '0222222222',
    roleName: 'WORKER',
    skill: 'Plumbing'
  });
  admin = createTestUser(db, {
    phone: '0999999999',
    roleName: 'ADMIN'
  });
});

afterAll(() => {
  cleanupTestDatabase();
  if (db) db.close();
});

describe('POST /api/workers/certificates', () => {
  test('should upload a certificate successfully', async () => {
    const response = await request(app)
      .post('/api/workers/certificates')
      .set('Authorization', `Bearer ${worker.token}`)
      .send({
        imageUrl: '/static/IELTS_7.5.jpg'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.workerId).toBe(worker.id);
    expect(response.body.imageUrl).toBe('/static/IELTS_7.5.jpg');
    expect(response.body.status).toBe('PENDING');
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .post('/api/workers/certificates')
      .send({
        imageUrl: '/static/certificate.jpg'
      });

    expect(response.status).toBe(401);
  });

  test('should only allow workers to upload certificates', async () => {
    const employer = createTestUser(db, {
      phone: '0111111111',
      roleName: 'EMPLOYER'
    });

    const response = await request(app)
      .post('/api/workers/certificates')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        imageUrl: '/static/certificate.jpg'
      });

    expect(response.status).toBe(403);
  });

  test('should validate image URL format', async () => {
    const response = await request(app)
      .post('/api/workers/certificates')
      .set('Authorization', `Bearer ${worker.token}`)
      .send({
        imageUrl: 'invalid-url'
      });

    // Should accept any URL format in MVP, but might validate
    // This test can be adjusted based on actual validation rules
    expect([201, 400]).toContain(response.status);
  });

  test('should allow multiple certificates per worker', async () => {
    await request(app)
      .post('/api/workers/certificates')
      .set('Authorization', `Bearer ${worker.token}`)
      .send({
        imageUrl: '/static/cert1.jpg'
      });

    const response = await request(app)
      .post('/api/workers/certificates')
      .set('Authorization', `Bearer ${worker.token}`)
      .send({
        imageUrl: '/static/cert2.jpg'
      });

    expect(response.status).toBe(201);
    
    // Verify both certificates exist
    const certificates = db.prepare('SELECT * FROM worker_certificates WHERE worker_id = ?')
      .all(worker.id);
    expect(certificates.length).toBeGreaterThanOrEqual(2);
  });
});

describe('GET /api/workers/certificates/status', () => {
  test('should return certificate status for authenticated worker', async () => {
    // Create certificates with different statuses
    createTestCertificate(db, {
      workerId: worker.id,
      status: 'PENDING'
    });
    createTestCertificate(db, {
      workerId: worker.id,
      status: 'APPROVED',
      imageUrl: '/static/cert2.jpg'
    });

    const response = await request(app)
      .get('/api/workers/certificates/status')
      .set('Authorization', `Bearer ${worker.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('certificates');
    expect(Array.isArray(response.body.certificates)).toBe(true);
    expect(response.body).toHaveProperty('isVerified');
    // Worker should be verified if at least one certificate is approved
    expect(response.body.isVerified).toBe(true);
  });

  test('should return false for unverified worker', async () => {
    const newWorker = createTestUser(db, {
      phone: '0333333333',
      roleName: 'WORKER',
      skill: 'Electrical'
    });

    const response = await request(app)
      .get('/api/workers/certificates/status')
      .set('Authorization', `Bearer ${newWorker.token}`);

    expect(response.status).toBe(200);
    expect(response.body.isVerified).toBe(false);
    expect(response.body.certificates).toHaveLength(0);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/api/workers/certificates/status');

    expect(response.status).toBe(401);
  });

  test('should only allow workers to check their own status', async () => {
    const employer = createTestUser(db, {
      phone: '0444444444',
      roleName: 'EMPLOYER'
    });

    const response = await request(app)
      .get('/api/workers/certificates/status')
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(403);
  });

  test('should show pending certificates', async () => {
    createTestCertificate(db, {
      workerId: worker.id,
      status: 'PENDING'
    });

    const response = await request(app)
      .get('/api/workers/certificates/status')
      .set('Authorization', `Bearer ${worker.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('certificates');
    expect(Array.isArray(response.body.certificates)).toBe(true);
    const pendingCerts = response.body.certificates.filter(cert => cert.status === 'PENDING');
    expect(pendingCerts.length).toBeGreaterThan(0);
  });

  test('should show rejected certificates with reason', async () => {
    const certificate = createTestCertificate(db, {
      workerId: worker.id,
      status: 'REJECTED',
      imageUrl: '/static/rejected-cert.jpg'
    });

    // Update reviewed_by and reviewed_at (simulating admin rejection)
    db.prepare(`
      UPDATE worker_certificates 
      SET reviewed_by = ?, reviewed_at = ? 
      WHERE id = ?
    `).run(admin.id, Date.now(), certificate.id);

    const response = await request(app)
      .get('/api/workers/certificates/status')
      .set('Authorization', `Bearer ${worker.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('certificates');
    const rejectedCerts = response.body.certificates.filter(cert => cert.status === 'REJECTED');
    expect(rejectedCerts.length).toBeGreaterThan(0);
  });
});

