/**
 * Integration tests for Job Applications module
 * Tests: Apply to job, List applications, Accept/Reject worker
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
let worker1;
let worker2;

beforeEach(() => {
  // Clean up existing data
  db.prepare('DELETE FROM job_applications').run();
  db.prepare('DELETE FROM jobs').run();
  db.prepare('DELETE FROM users WHERE phone IN (?, ?, ?)').run(
    '0111111111', '0222222222', '0333333333'
  );
  
  employer = createTestUser(db, {
    phone: '0111111111',
    roleName: 'EMPLOYER'
  });
  worker1 = createTestUser(db, {
    phone: '0222222222',
    roleName: 'WORKER',
    skill: 'Plumbing'
  });
  worker2 = createTestUser(db, {
    phone: '0333333333',
    roleName: 'WORKER',
    skill: 'Electrical'
  });
});

afterAll(() => {
  cleanupTestDatabase();
  if (db) db.close();
});

describe('POST /api/jobs/:jobId/apply', () => {
  test('should allow worker to apply to open job', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM',
      requiredSkill: 'Plumbing'
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker1.token}`);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.jobId).toBe(job.id);
    expect(response.body.workerId).toBe(worker1.id);
    expect(response.body.status).toBe('APPLIED');
  });

  test('should reject applying to completed job (DA_XONG)', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG'
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker1.token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should prevent duplicate applications', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    // First application
    await request(app)
      .post(`/api/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker1.token}`);

    // Try to apply again
    const response = await request(app)
      .post(`/api/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker1.token}`);

    expect(response.status).toBe(400);
  });

  test('should require authentication', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/apply`);

    expect(response.status).toBe(401);
  });

  test('should prevent employer from applying to own job', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${employer.token}`);

    // Employer role is rejected by middleware (403) before business logic check
    expect(response.status).toBe(403);
  });
});

describe('GET /api/jobs/:jobId/applications', () => {
  test('should return applications for a job', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    createTestApplication(db, { jobId: job.id, workerId: worker1.id });
    createTestApplication(db, { jobId: job.id, workerId: worker2.id });

    const response = await request(app)
      .get(`/api/jobs/${job.id}/applications`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body.every(app => app.jobId === job.id)).toBe(true);
  });

  test('should only allow job owner to view applications', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const otherEmployer = createTestUser(db, { phone: '0444444444', roleName: 'EMPLOYER' });

    const response = await request(app)
      .get(`/api/jobs/${job.id}/applications`)
      .set('Authorization', `Bearer ${otherEmployer.token}`);

    expect(response.status).toBe(403);
  });

  test('should include worker profile information', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    createTestApplication(db, { jobId: job.id, workerId: worker1.id });

    const response = await request(app)
      .get(`/api/jobs/${job.id}/applications`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);
    expect(response.body[0]).toHaveProperty('worker');
    expect(response.body[0].worker).toHaveProperty('fullName');
    expect(response.body[0].worker).toHaveProperty('skill');
  });
});

describe('POST /api/jobs/:jobId/accept/:workerId', () => {
  test('should accept a worker application', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    createTestApplication(db, { jobId: job.id, workerId: worker1.id });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/accept/${worker1.id}`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);
    
    // Verify job status changed to DANG_BAN_GIAO
    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
    expect(updatedJob.status).toBe('DANG_BAN_GIAO');
    expect(updatedJob.accepted_worker_id).toBe(worker1.id);

    // Verify application status changed to ACCEPTED
    const application = db.prepare('SELECT * FROM job_applications WHERE job_id = ? AND worker_id = ?')
      .get(job.id, worker1.id);
    expect(application.status).toBe('ACCEPTED');

    // Verify status log was created
    const statusLog = db.prepare('SELECT * FROM job_status_logs WHERE job_id = ? ORDER BY changed_at DESC')
      .get(job.id);
    expect(statusLog).toBeDefined();
    expect(statusLog.old_status).toBe('CHUA_LAM');
    expect(statusLog.new_status).toBe('DANG_BAN_GIAO');
  });

  test('should prevent accepting more than one worker', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    createTestApplication(db, { jobId: job.id, workerId: worker1.id });
    createTestApplication(db, { jobId: job.id, workerId: worker2.id });

    // Accept first worker
    await request(app)
      .post(`/api/jobs/${job.id}/accept/${worker1.id}`)
      .set('Authorization', `Bearer ${employer.token}`);

    // Try to accept second worker
    const response = await request(app)
      .post(`/api/jobs/${job.id}/accept/${worker2.id}`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should only allow job owner to accept', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    createTestApplication(db, { jobId: job.id, workerId: worker1.id });

    const otherEmployer = createTestUser(db, { phone: '0555555555', roleName: 'EMPLOYER' });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/accept/${worker1.id}`)
      .set('Authorization', `Bearer ${otherEmployer.token}`);

    expect(response.status).toBe(403);
  });

  test('should reject accepting worker who did not apply', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/accept/${worker1.id}`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(400);
  });
});

describe('POST /api/jobs/:jobId/reject/:workerId', () => {
  test('should reject a worker application', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    createTestApplication(db, { jobId: job.id, workerId: worker1.id });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/reject/${worker1.id}`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);

    // Verify application status changed to REJECTED
    const application = db.prepare('SELECT * FROM job_applications WHERE job_id = ? AND worker_id = ?')
      .get(job.id, worker1.id);
    expect(application.status).toBe('REJECTED');
  });

  test('should only allow job owner to reject', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    createTestApplication(db, { jobId: job.id, workerId: worker1.id });

    const otherEmployer = createTestUser(db, { phone: '0666666666', roleName: 'EMPLOYER' });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/reject/${worker1.id}`)
      .set('Authorization', `Bearer ${otherEmployer.token}`);

    expect(response.status).toBe(403);
  });
});

