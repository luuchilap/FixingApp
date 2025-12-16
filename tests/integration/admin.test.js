/**
 * Integration tests for Admin module
 * Tests: Approve/Reject jobs, Approve/Reject certificates
 */

const request = require('supertest');
const { initTestDatabase, cleanupTestDatabase } = require('../setup');
const { createTestUser, createTestJob, createTestCertificate } = require('../helpers');

const path = require('path');
const { TEST_DB_PATH } = require('../setup');

// Set test environment and database path
process.env.NODE_ENV = 'test';
process.env.DB_PATH = TEST_DB_PATH;

// Initialize test database BEFORE loading app
const db = initTestDatabase();

// Now load app - it will use the test database
const app = require('../../src/app');

let employer;
let worker;
let admin;

beforeEach(() => {
  // Clean up existing data
  db.prepare('DELETE FROM worker_certificates').run();
  db.prepare('DELETE FROM jobs').run();
  db.prepare('DELETE FROM users WHERE phone IN (?, ?, ?)').run('0111111111', '0222222222', '0999999999');
  
  employer = createTestUser(db, {
    phone: '0111111111',
    roleName: 'EMPLOYER'
  });
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

describe('GET /api/admin/jobs/pending', () => {
  test('should return jobs pending approval', async () => {
    // Create jobs with different statuses
    // Note: In MVP, jobs might need an approval_status field or be created with a pending status
    // This test assumes jobs need admin approval before being visible
    
    const response = await request(app)
      .get('/api/admin/jobs/pending')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should require admin role', async () => {
    const response = await request(app)
      .get('/api/admin/jobs/pending')
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(403);
  });
});

describe('POST /api/admin/jobs/:jobId/approve', () => {
  test('should approve a pending job', async () => {
    // Create a job that needs approval
    // Note: This assumes jobs have an approval mechanism
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/admin/jobs/${job.id}/approve`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('approved', true);
  });

  test('should require admin role', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/admin/jobs/${job.id}/approve`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(403);
  });
});

describe('POST /api/admin/jobs/:jobId/reject', () => {
  test('should reject a pending job', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/admin/jobs/${job.id}/reject`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        reason: 'Job description violates guidelines'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rejected', true);
  });

  test('should require admin role', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/admin/jobs/${job.id}/reject`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        reason: 'Test rejection'
      });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/admin/certificates/pending', () => {
  test('should return pending certificates', async () => {
    // Create pending certificates
    createTestCertificate(db, {
      workerId: worker.id,
      status: 'PENDING'
    });

    const otherWorker = createTestUser(db, {
      phone: '0333333333',
      roleName: 'WORKER',
      skill: 'Electrical'
    });
    createTestCertificate(db, {
      workerId: otherWorker.id,
      status: 'PENDING'
    });

    const response = await request(app)
      .get('/api/admin/certificates/pending')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
    expect(response.body.every(cert => cert.status === 'PENDING')).toBe(true);
  });

  test('should require admin role', async () => {
    const response = await request(app)
      .get('/api/admin/certificates/pending')
      .set('Authorization', `Bearer ${worker.token}`);

    expect(response.status).toBe(403);
  });
});

describe('POST /api/admin/certificates/:certId/approve', () => {
  test('should approve a certificate', async () => {
    const certificate = createTestCertificate(db, {
      workerId: worker.id,
      status: 'PENDING'
    });

    const response = await request(app)
      .post(`/api/admin/certificates/${certificate.id}/approve`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    
    // Verify certificate was approved
    const updatedCert = db.prepare('SELECT * FROM worker_certificates WHERE id = ?')
      .get(certificate.id);
    expect(updatedCert.status).toBe('APPROVED');
    expect(updatedCert.reviewed_by).toBe(admin.id);
    expect(updatedCert.reviewed_at).toBeDefined();

    // Verify worker profile is_verified was updated
    const workerProfile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?')
      .get(worker.id);
    expect(workerProfile.is_verified).toBe(1);
  });

  test('should require admin role', async () => {
    const certificate = createTestCertificate(db, {
      workerId: worker.id,
      status: 'PENDING'
    });

    const response = await request(app)
      .post(`/api/admin/certificates/${certificate.id}/approve`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(403);
  });

  test('should reject approving already approved certificate', async () => {
    const certificate = createTestCertificate(db, {
      workerId: worker.id,
      status: 'APPROVED',
      reviewedBy: admin.id
    });

    const response = await request(app)
      .post(`/api/admin/certificates/${certificate.id}/approve`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(400);
  });
});

describe('POST /api/admin/certificates/:certId/reject', () => {
  test('should reject a certificate', async () => {
    const certificate = createTestCertificate(db, {
      workerId: worker.id,
      status: 'PENDING'
    });

    const response = await request(app)
      .post(`/api/admin/certificates/${certificate.id}/reject`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        reason: 'Certificate image is not clear'
      });

    expect(response.status).toBe(200);
    
    // Verify certificate was rejected
    const updatedCert = db.prepare('SELECT * FROM worker_certificates WHERE id = ?')
      .get(certificate.id);
    expect(updatedCert.status).toBe('REJECTED');
    expect(updatedCert.reviewed_by).toBe(admin.id);
    expect(updatedCert.reviewed_at).toBeDefined();
  });

  test('should require admin role', async () => {
    const certificate = createTestCertificate(db, {
      workerId: worker.id,
      status: 'PENDING'
    });

    const response = await request(app)
      .post(`/api/admin/certificates/${certificate.id}/reject`)
      .set('Authorization', `Bearer ${worker.token}`)
      .send({
        reason: 'Test rejection'
      });

    expect(response.status).toBe(403);
  });
});

