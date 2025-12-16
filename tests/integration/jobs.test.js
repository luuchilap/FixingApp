/**
 * Integration tests for Jobs module
 * Tests: Create, Read, Update, Delete, List jobs
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
  // Clean up existing users and jobs
  db.prepare('DELETE FROM jobs').run();
  db.prepare('DELETE FROM users WHERE phone IN (?, ?, ?, ?, ?)').run(
    '0111111111', '0222222222', '0333333333', '0444444444', '0555555555'
  );
  
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

describe('POST /api/jobs', () => {
  test('should create a new job successfully', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        title: 'Fix leaking pipe',
        description: 'Need to fix a leaking pipe in kitchen',
        price: 150000,
        address: '123 Main St, City',
        requiredSkill: 'Plumbing',
        images: ['/static/pipe1.jpg']
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Fix leaking pipe');
    expect(response.body.status).toBe('CHUA_LAM');
    expect(response.body.employerId).toBe(employer.id);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .send({
        title: 'Test Job',
        description: 'Test',
        price: 100000,
        address: 'Test Address'
      });

    expect(response.status).toBe(401);
  });

  test('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        title: 'Incomplete Job'
        // Missing required fields
      });

    expect(response.status).toBe(400);
  });

  test('should create job with multiple images', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        title: 'Renovate bathroom',
        description: 'Full bathroom renovation',
        price: 5000000,
        address: '456 Oak Ave',
        requiredSkill: 'Plumbing',
        images: ['/static/bath1.jpg', '/static/bath2.jpg', '/static/bath3.jpg']
      });

    expect(response.status).toBe(201);
    // Verify images were saved
    const images = db.prepare('SELECT * FROM job_images WHERE job_id = ?').all(response.body.id);
    expect(images).toHaveLength(3);
    expect(images.some(img => img.is_primary === 1)).toBe(true);
  });
});

describe('GET /api/jobs/my', () => {
  test('should return jobs created by authenticated employer', async () => {
    // Create jobs for this employer
    createTestJob(db, { employerId: employer.id, title: 'Job 1' });
    createTestJob(db, { employerId: employer.id, title: 'Job 2' });
    // Create job for another employer
    const otherEmployer = createTestUser(db, { phone: '0333333333', roleName: 'EMPLOYER' });
    createTestJob(db, { employerId: otherEmployer.id, title: 'Other Job' });

    const response = await request(app)
      .get('/api/jobs/my')
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body.every(job => job.employerId === employer.id)).toBe(true);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/api/jobs/my');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/jobs', () => {
  test('should return only open jobs (CHUA_LAM, DANG_BAN_GIAO)', async () => {
    // Create jobs with different statuses
    createTestJob(db, { employerId: employer.id, title: 'Open Job', status: 'CHUA_LAM' });
    createTestJob(db, { employerId: employer.id, title: 'In Progress', status: 'DANG_BAN_GIAO' });
    createTestJob(db, { employerId: employer.id, title: 'Completed', status: 'DA_XONG' });

    const response = await request(app)
      .get('/api/jobs');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body.every(job => job.status !== 'DA_XONG')).toBe(true);
  });

  test('should support keyword search', async () => {
    createTestJob(db, { employerId: employer.id, title: 'Fix pipe', description: 'Plumbing work' });
    createTestJob(db, { employerId: employer.id, title: 'Paint wall', description: 'Painting work' });

    const response = await request(app)
      .get('/api/jobs?keyword=pipe');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every(job => 
      job.title.toLowerCase().includes('pipe') || 
      job.description.toLowerCase().includes('pipe')
    )).toBe(true);
  });

  test('should support price filtering', async () => {
    createTestJob(db, { employerId: employer.id, title: 'Cheap Job', price: 50000 });
    createTestJob(db, { employerId: employer.id, title: 'Expensive Job', price: 500000 });

    const response = await request(app)
      .get('/api/jobs?minPrice=100000&maxPrice=300000');

    expect(response.status).toBe(200);
    expect(response.body.every(job => 
      job.price >= 100000 && job.price <= 300000
    )).toBe(true);
  });
});

describe('GET /api/jobs/:jobId', () => {
  test('should return job details', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      title: 'Detailed Job',
      description: 'Full description here'
    });

    const response = await request(app)
      .get(`/api/jobs/${job.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(job.id);
    expect(response.body.title).toBe('Detailed Job');
    expect(response.body).toHaveProperty('images');
  });

  test('should return 404 for non-existent job', async () => {
    const response = await request(app)
      .get('/api/jobs/99999');

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/jobs/:jobId', () => {
  test('should update job when status is CHUA_LAM', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      title: 'Original Title',
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .put(`/api/jobs/${job.id}`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        title: 'Updated Title',
        description: 'Updated description',
        price: 200000
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated Title');
  });

  test('should reject update when job has accepted worker', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .put(`/api/jobs/${job.id}`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        title: 'Try to update'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('should only allow job owner to update', async () => {
    const otherEmployer = createTestUser(db, { phone: '0444444444', roleName: 'EMPLOYER' });
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .put(`/api/jobs/${job.id}`)
      .set('Authorization', `Bearer ${otherEmployer.token}`)
      .send({
        title: 'Unauthorized update'
      });

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/jobs/:jobId', () => {
  test('should delete job when status is CHUA_LAM', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'CHUA_LAM'
    });

    const response = await request(app)
      .delete(`/api/jobs/${job.id}`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(200);
    
    // Verify job is deleted
    const deletedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job.id);
    expect(deletedJob).toBeUndefined();
  });

  test('should reject delete when job has accepted worker', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .delete(`/api/jobs/${job.id}`)
      .set('Authorization', `Bearer ${employer.token}`);

    expect(response.status).toBe(400);
  });
});

