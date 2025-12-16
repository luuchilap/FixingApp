/**
 * Integration tests for System Tasks module
 * Tests: Expire handover jobs
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

beforeEach(() => {
  // Clean up existing data
  db.prepare('DELETE FROM notifications').run();
  db.prepare('DELETE FROM job_status_logs').run();
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

describe('POST /api/system/jobs/expire-handover', () => {
  test('should expire overdue handover jobs', async () => {
    const now = Date.now();
    const overdueDeadline = now - (31 * 24 * 60 * 60 * 1000); // 31 days ago

    // Create overdue job
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id,
      handoverDeadline: overdueDeadline
    });

    const response = await request(app)
      .post('/api/system/jobs/expire-handover');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('jobs');
    expect(response.body.jobs.length).toBe(1);
    expect(response.body.jobs[0].id).toBe(job.id);
    expect(response.body.jobs[0].oldStatus).toBe('DANG_BAN_GIAO');
    expect(response.body.jobs[0].newStatus).toBe('CHUA_LAM');

    // Verify job status was updated
    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
    expect(updatedJob.status).toBe('CHUA_LAM');
    expect(updatedJob.accepted_worker_id).toBeNull();
    expect(updatedJob.handover_deadline).toBeNull();
  });

  test('should not expire jobs that are not overdue', async () => {
    const now = Date.now();
    const futureDeadline = now + (10 * 24 * 60 * 60 * 1000); // 10 days in future

    // Create job with future deadline
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id,
      handoverDeadline: futureDeadline
    });

    const response = await request(app)
      .post('/api/system/jobs/expire-handover');

    expect(response.status).toBe(200);
    expect(response.body.jobs.length).toBe(0);

    // Verify job status was not changed
    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
    expect(updatedJob.status).toBe('DANG_BAN_GIAO');
  });

  test('should not expire jobs in other statuses', async () => {
    const now = Date.now();
    const overdueDeadline = now - (31 * 24 * 60 * 60 * 1000);

    // Create job in CHUA_LAM status (even if overdue)
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM',
      handoverDeadline: overdueDeadline
    });

    const response = await request(app)
      .post('/api/system/jobs/expire-handover');

    expect(response.status).toBe(200);
    expect(response.body.jobs.length).toBe(0);
  });

  test('should send notifications to employer and worker', async () => {
    const now = Date.now();
    const overdueDeadline = now - (31 * 24 * 60 * 60 * 1000);

    // Create overdue job
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id,
      handoverDeadline: overdueDeadline
    });

    await request(app)
      .post('/api/system/jobs/expire-handover');

    // Check notifications were created
    const employerNotifications = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ?
    `).all(employer.id);
    
    const workerNotifications = db.prepare(`
      SELECT * FROM notifications WHERE user_id = ?
    `).all(worker.id);

    expect(employerNotifications.length).toBeGreaterThan(0);
    expect(workerNotifications.length).toBeGreaterThan(0);
  });

  test('should create status log for expired jobs', async () => {
    const now = Date.now();
    const overdueDeadline = now - (31 * 24 * 60 * 60 * 1000);

    // Create overdue job
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id,
      handoverDeadline: overdueDeadline
    });

    await request(app)
      .post('/api/system/jobs/expire-handover');

    // Check status log was created
    const statusLogs = db.prepare(`
      SELECT * FROM job_status_logs WHERE job_id = ?
    `).all(job.id);

    expect(statusLogs.length).toBeGreaterThan(0);
    const latestLog = statusLogs[statusLogs.length - 1];
    expect(latestLog.old_status).toBe('DANG_BAN_GIAO');
    expect(latestLog.new_status).toBe('CHUA_LAM');
  });
});

