/**
 * Integration tests for Job Status Management
 * Tests: Complete job, Reset job status, Status transitions
 */

const request = require('supertest');
const { initTestDatabase, cleanupTestDatabase } = require('../setup');
const { createTestUser, createTestJob, createTestApplication } = require('../helpers');

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

beforeEach(() => {
  // Clean up existing data
  db.prepare('DELETE FROM job_status_logs').run();
  db.prepare('DELETE FROM job_applications').run();
  db.prepare('DELETE FROM jobs').run();
  db.prepare('DELETE FROM users WHERE phone IN (?, ?)').run('0111111111', '0222222222');
  
  employer = createTestUser(db, {
    phone: '0111111111',
    roleName: 'EMPLOYER'
  });
  worker = createTestUser(db, {
    phone: '0222222222',
    roleName: 'WORKER',
    skill: 'Plumbing'
  });
});

afterAll(() => {
  cleanupTestDatabase();
  if (db) db.close();
});

describe('POST /api/jobs/:jobId/complete', () => {
  test('should complete a job in DANG_BAN_GIAO status', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/complete`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);
    
    // Verify job status changed to DA_XONG
    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
    expect(updatedJob.status).toBe('DA_XONG');

    // Verify status log was created
    const statusLog = db.prepare('SELECT * FROM job_status_logs WHERE job_id = ? ORDER BY changed_at DESC')
      .get(job.id);
    expect(statusLog).toBeDefined();
    expect(statusLog.old_status).toBe('DANG_BAN_GIAO');
    expect(statusLog.new_status).toBe('DA_XONG');
  });

  test('should only allow job owner to complete', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const otherEmployer = createTestUser(db, { phone: '0333333333', roleName: 'EMPLOYER' });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/complete`)
      .set('Authorization', `Bearer ${otherEmployer.token}`);

    expect(response.status).toBe(403);
  });

  test('should reject completing job not in DANG_BAN_GIAO status', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/complete`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should reject completing job without accepted worker', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: null
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/complete`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(400);
  });
});

describe('POST /api/jobs/:jobId/reset', () => {
  test('should reset job from DANG_BAN_GIAO to CHUA_LAM', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/reset`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);
    
    // Verify job status changed to CHUA_LAM
    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
    expect(updatedJob.status).toBe('CHUA_LAM');
    expect(updatedJob.accepted_worker_id).toBeNull();

    // Verify status log was created
    const statusLog = db.prepare('SELECT * FROM job_status_logs WHERE job_id = ? ORDER BY changed_at DESC')
      .get(job.id);
    expect(statusLog).toBeDefined();
    expect(statusLog.old_status).toBe('DANG_BAN_GIAO');
    expect(statusLog.new_status).toBe('CHUA_LAM');
  });

  test('should clear accepted worker when resetting', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    await request(app)
      .post(`/api/jobs/${job.id}/reset`)
      .set('Authorization', `Bearer ${employer.token}`);

    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
    expect(updatedJob.accepted_worker_id).toBeNull();
  });

  test('should only allow job owner to reset', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const otherEmployer = createTestUser(db, { phone: '0444444444', roleName: 'EMPLOYER' });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/reset`)
      .set('Authorization', `Bearer ${otherEmployer.token}`);

    expect(response.status).toBe(403);
  });

  test('should reject resetting job not in DANG_BAN_GIAO status', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/reset`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(400);
  });
});

describe('GET /api/jobs/:jobId/status', () => {
  test('should return current job status', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .get(`/api/jobs/${job.id}/status`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('DANG_BAN_GIAO');
    expect(response.body).toHaveProperty('acceptedWorkerId');
    expect(response.body.acceptedWorkerId).toBe(worker.id);
  });

  test('should return 404 for non-existent job', async () => {
    const response = await request(app)
      .get('/api/jobs/99999/status');

    expect(response.status).toBe(404);
  });
});

