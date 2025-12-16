/**
 * Integration tests for Business Rules
 * Tests critical business logic and constraints
 */

const request = require('supertest');
const { initTestDatabase, cleanupTestDatabase } = require('../setup');
const { createTestUser, createTestJob, createTestApplication, createTestCertificate } = require('../helpers');

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
  db.prepare('DELETE FROM worker_reviews').run();
  db.prepare('DELETE FROM job_status_logs').run();
  db.prepare('DELETE FROM job_applications').run();
  db.prepare('DELETE FROM worker_certificates').run();
  db.prepare('DELETE FROM jobs').run();
  db.prepare('DELETE FROM users WHERE phone IN (?, ?, ?)').run('0111111111', '0222222222', '0333333333');
  
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

describe('Business Rule: Cannot apply to completed job (DA_XONG)', () => {
  test('should reject application to completed job', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker1.id
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/apply`)
      .set('Authorization', `Bearer ${worker2.token}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/completed|Cannot apply/i);
  });
});

describe('Business Rule: Cannot edit job when worker is accepted', () => {
  test('should reject editing job with accepted worker', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker1.id
    });

    const response = await request(app)
      .put(`/api/jobs/${job.id}`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        title: 'Try to edit',
        description: 'This should fail',
        price: 200000
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should allow editing job without accepted worker', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM',
      acceptedWorkerId: null
    });

    const response = await request(app)
      .put(`/api/jobs/${job.id}`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        title: 'Updated Title',
        description: 'Updated description',
        price: 150000
      });

    expect(response.status).toBe(200);
  });
});

describe('Business Rule: Cannot review same job twice', () => {
  test('should prevent duplicate reviews for same job', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker1.id
    });

    // Create first review
    await request(app)
      .post(`/api/jobs/${job.id}/review`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        stars: 5,
        comment: 'First review'
      });

    // Try to review again
    const response = await request(app)
      .post(`/api/jobs/${job.id}/review`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        stars: 4,
        comment: 'Second review attempt'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Business Rule: Cannot accept more than one worker per job', () => {
  test('should prevent accepting second worker after first is accepted', async () => {
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
    
    // Verify only first worker is accepted
    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
    expect(updatedJob.accepted_worker_id).toBe(worker1.id);
  });
});

describe('Business Rule: Job status transitions', () => {
  test('should only allow completing job in DANG_BAN_GIAO status', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/complete`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(400);
  });

  test('should only allow resetting job from DANG_BAN_GIAO to CHUA_LAM', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/reset`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(400);
  });

  test('should create status log on status change', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    createTestApplication(db, { jobId: job.id, workerId: worker1.id });

    // Accept worker (should change status to DANG_BAN_GIAO)
    await request(app)
      .post(`/api/jobs/${job.id}/accept/${worker1.id}`)
      .set('Authorization', `Bearer ${employer.token}`);

    // Verify status log was created
    const statusLogs = db.prepare('SELECT * FROM job_status_logs WHERE job_id = ?')
      .all(job.id);
    expect(statusLogs.length).toBeGreaterThan(0);
    expect(statusLogs.some(log => 
      log.old_status === 'CHUA_LAM' && log.new_status === 'DANG_BAN_GIAO'
    )).toBe(true);
  });
});

describe('Business Rule: Completed jobs hidden from job list', () => {
  test('should exclude DA_XONG jobs from public job list', async () => {
    // Create jobs with different statuses
    createTestJob(db, {
      employerId: employer.id,
      title: 'Open Job',
      status: 'CHUA_LAM'
    });
    createTestJob(db, {
      employerId: employer.id,
      title: 'In Progress Job',
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker1.id
    });
    createTestJob(db, {
      employerId: employer.id,
      title: 'Completed Job',
      status: 'DA_XONG',
      acceptedWorkerId: worker1.id
    });

    const response = await request(app)
      .get('/api/jobs');

    expect(response.status).toBe(200);
    expect(response.body.every(job => job.status !== 'DA_XONG')).toBe(true);
    expect(response.body.some(job => job.title === 'Completed Job')).toBe(false);
  });
});

describe('Business Rule: Unique application per job-worker pair', () => {
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
    
    // Verify only one application exists
    const applications = db.prepare('SELECT * FROM job_applications WHERE job_id = ? AND worker_id = ?')
      .all(job.id, worker1.id);
    expect(applications).toHaveLength(1);
  });
});

describe('Business Rule: Worker verification affects profile', () => {
  test('should update worker profile is_verified when certificate is approved', async () => {
    const certificate = createTestCertificate(db, {
      workerId: worker1.id,
      status: 'PENDING'
    });

    const admin = createTestUser(db, {
      phone: '0999999999',
      roleName: 'ADMIN'
    });

    // Approve certificate
    await request(app)
      .post(`/api/admin/certificates/${certificate.id}/approve`)
      .set('Authorization', `Bearer ${admin.token}`);

    // Verify worker profile was updated
    const workerProfile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?')
      .get(worker1.id);
    expect(workerProfile.is_verified).toBe(1);
  });
});

