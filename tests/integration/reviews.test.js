/**
 * Integration tests for Reviews module
 * Tests: Create review, View worker reviews, Business rules
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
  db.prepare('DELETE FROM worker_reviews').run();
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

describe('POST /api/jobs/:jobId/review', () => {
  test('should create a review for completed job', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/review`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        stars: 5,
        comment: 'Excellent work! Very professional.'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.stars).toBe(5);
    expect(response.body.comment).toBe('Excellent work! Very professional.');
    expect(response.body.workerId).toBe(worker.id);
    expect(response.body.employerId).toBe(employer.id);
  });

  test('should prevent reviewing same job twice', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker.id
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

  test('should only allow job owner to review', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker.id
    });

    const otherEmployer = createTestUser(db, { phone: '0333333333', roleName: 'EMPLOYER' });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/review`)
      .set('Authorization', `Bearer ${otherEmployer.token}`)
      .send({
        stars: 5,
        comment: 'Unauthorized review'
      });

    expect(response.status).toBe(403);
  });

  test('should reject review for non-completed job', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DANG_BAN_GIAO',
      acceptedWorkerId: worker.id
    });

    const response = await request(app)
      .post(`/api/jobs/${job.id}/review`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        stars: 5,
        comment: 'Review before completion'
      });

    expect(response.status).toBe(400);
  });

  test('should validate star rating (1-5)', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker.id
    });

    // Test invalid ratings
    const invalidRatings = [0, 6, -1, 10];

    for (const rating of invalidRatings) {
      const response = await request(app)
        .post(`/api/jobs/${job.id}/review`)
        .set('Authorization', `Bearer ${employer.token}`)
        .send({
          stars: rating,
          comment: 'Test comment'
        });

      expect(response.status).toBe(400);
    }
  });

  test('should update worker average rating', async () => {
    const job1 = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker.id
    });

    const job2 = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker.id
    });

    // Create reviews
    await request(app)
      .post(`/api/jobs/${job1.id}/review`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({ stars: 5, comment: 'Great!' });

    await request(app)
      .post(`/api/jobs/${job2.id}/review`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({ stars: 4, comment: 'Good!' });

    // Verify average rating was updated
    const workerProfile = db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(worker.id);
    expect(workerProfile.avg_rating).toBe(4.5);
  });
});

describe('GET /api/workers/:workerId/reviews', () => {
  test('should return all reviews for a worker', async () => {
    const job1 = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker.id
    });

    const otherEmployer = createTestUser(db, { phone: '0444444444', roleName: 'EMPLOYER' });
    const job2 = createTestJob(db, {
      employerId: otherEmployer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker.id
    });

    // Create reviews
    await request(app)
      .post(`/api/jobs/${job1.id}/review`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({ stars: 5, comment: 'Review 1' });

    await request(app)
      .post(`/api/jobs/${job2.id}/review`)
      .set('Authorization', `Bearer ${otherEmployer.token}`)
      .send({ stars: 4, comment: 'Review 2' });

    const response = await request(app)
      .get(`/api/workers/${worker.id}/reviews`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body.every(review => review.workerId === worker.id)).toBe(true);
  });

  test('should return empty array for worker with no reviews', async () => {
    const newWorker = createTestUser(db, {
      phone: '0555555555',
      roleName: 'WORKER',
      skill: 'Electrical'
    });

    const response = await request(app)
      .get(`/api/workers/${newWorker.id}/reviews`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  test('should include employer information in reviews', async () => {
    const job = createTestJob(db, {
      employerId: employer.id,
      status: 'DA_XONG',
      acceptedWorkerId: worker.id
    });

    await request(app)
      .post(`/api/jobs/${job.id}/review`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({ stars: 5, comment: 'Test review' });

    const response = await request(app)
      .get(`/api/workers/${worker.id}/reviews`);

    expect(response.status).toBe(200);
    expect(response.body[0]).toHaveProperty('employer');
    expect(response.body[0].employer).toHaveProperty('fullName');
  });
});

