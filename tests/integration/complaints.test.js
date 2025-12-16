/**
 * Integration tests for Complaints module
 * Tests: Create complaint, View complaints, Admin resolution
 */

const request = require('supertest');
const { initTestDatabase, cleanupTestDatabase } = require('../setup');
const { createTestUser, createTestJob } = require('../helpers');

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
  db.prepare('DELETE FROM complaint_evidences').run();
  db.prepare('DELETE FROM complaints').run();
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

describe('POST /api/complaints', () => {
  test('should create a complaint successfully', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        jobId: job.id,
        reason: 'Worker did not show up on time',
        evidences: [
          { type: 'IMAGE', url: '/static/evidence1.jpg' },
          { type: 'LOG', url: '/static/log.txt' }
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.jobId).toBe(job.id);
    expect(response.body.reason).toBe('Worker did not show up on time');
    expect(response.body.status).toBe('PENDING');
    expect(response.body.createdBy).toBe(employer.id);
  });

  test('should allow worker to create complaint', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${worker.token}`)
      .send({
        jobId: job.id,
        reason: 'Employer changed requirements without notice'
      });

    expect(response.status).toBe(201);
    expect(response.body.createdBy).toBe(worker.id);
  });

  test('should require authentication', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .post('/api/complaints')
      .send({
        jobId: job.id,
        reason: 'Test complaint'
      });

    expect(response.status).toBe(401);
  });

  test('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        // Missing jobId and reason
      });

    expect(response.status).toBe(400);
  });

  test('should store evidence files', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        jobId: job.id,
        reason: 'Test with evidence',
        evidences: [
          { type: 'IMAGE', url: '/static/evidence1.jpg' },
          { type: 'IMAGE', url: '/static/evidence2.jpg' }
        ]
      });

    expect(response.status).toBe(201);
    
    // Verify evidences were stored
    const evidences = db.prepare('SELECT * FROM complaint_evidences WHERE complaint_id = ?')
      .all(response.body.id);
    expect(evidences).toHaveLength(2);
  });
});

describe('GET /api/complaints/my', () => {
  test('should return complaints created by authenticated user', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    // Create complaints
    await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        jobId: job.id,
        reason: 'Complaint 1'
      });

    await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        jobId: job.id,
        reason: 'Complaint 2'
      });

    // Create complaint by another user
    const otherEmployer = createTestUser(db, { phone: '0333333333', roleName: 'EMPLOYER' });
    const otherJob = createTestJob(db, {
      employerId: otherEmployer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });
    await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${otherEmployer.token}`)
      .send({
        jobId: otherJob.id,
        reason: 'Other complaint'
      });

    const response = await request(app)
      .get('/api/complaints/my')
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body.every(complaint => complaint.createdBy === employer.id)).toBe(true);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/api/complaints/my');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/admin/complaints', () => {
  test('should return all complaints for admin', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    // Create complaints
    await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        jobId: job.id,
        reason: 'Complaint 1'
      });

    await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${worker.token}`)
      .send({
        jobId: job.id,
        reason: 'Complaint 2'
      });

    const response = await request(app)
      .get('/api/admin/complaints')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
  });

  test('should require admin role', async () => {
    const response = await request(app)
      .get('/api/admin/complaints')
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(403);
  });
});

describe('POST /api/admin/complaints/:complaintId/resolve', () => {
  test('should resolve complaint with decision', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    // Create complaint
    const complaintResponse = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        jobId: job.id,
        reason: 'Test complaint'
      });

    const complaintId = complaintResponse.body.id;

    // Resolve complaint
    const response = await request(app)
      .post(`/api/admin/complaints/${complaintId}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        decision: 'ACCEPT',
        notes: 'Complaint is valid'
      });

    expect(response.status).toBe(200);
    
    // Verify complaint was resolved
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId);
    expect(complaint.status).toBe('RESOLVED');
    expect(complaint.decision).toBe('ACCEPT');
    expect(complaint.resolved_by).toBe(admin.id);
    expect(complaint.resolved_at).toBeDefined();
  });

  test('should require admin role', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const complaintResponse = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        jobId: job.id,
        reason: 'Test complaint'
      });

    const response = await request(app)
      .post(`/api/admin/complaints/${complaintResponse.body.id}/resolve`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        decision: 'ACCEPT'
      });

    expect(response.status).toBe(403);
  });

  test('should validate decision value', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const complaintResponse = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        jobId: job.id,
        reason: 'Test complaint'
      });

    const response = await request(app)
      .post(`/api/admin/complaints/${complaintResponse.body.id}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        decision: 'INVALID_DECISION'
      });

    expect(response.status).toBe(400);
  });
});

