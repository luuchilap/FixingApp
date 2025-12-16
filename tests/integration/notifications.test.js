/**
 * Integration tests for Notifications module
 * Tests: Get notifications, Mark as read
 */

const request = require('supertest');
const { initTestDatabase, cleanupTestDatabase } = require('../setup');
const { createTestUser } = require('../helpers');

const path = require('path');
const { TEST_DB_PATH } = require('../setup');

// Set test environment and database path
process.env.NODE_ENV = 'test';
process.env.DB_PATH = TEST_DB_PATH;

// Initialize test database BEFORE loading app
const db = initTestDatabase();

// Now load app - it will use the test database
const app = require('../../src/app');

let user;

beforeEach(() => {
  // Clean up existing data
  db.prepare('DELETE FROM notifications').run();
  db.prepare('DELETE FROM users WHERE phone = ?').run('0111111111');
  
  user = createTestUser(db, {
    phone: '0111111111',
    roleName: 'EMPLOYER'
  });
});

afterAll(() => {
  cleanupTestDatabase();
  if (db) db.close();
});

describe('GET /api/notifications', () => {
  test('should return user notifications', async () => {
    // Create test notifications
    const now = Date.now();
    db.prepare(`
      INSERT INTO notifications (user_id, content, is_read, created_at)
      VALUES (?, ?, 0, ?)
    `).run(user.id, 'Test notification 1', now);
    
    db.prepare(`
      INSERT INTO notifications (user_id, content, is_read, created_at)
      VALUES (?, ?, 1, ?)
    `).run(user.id, 'Test notification 2', now - 1000);

    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${user.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('content');
    expect(response.body[0]).toHaveProperty('isRead');
  });

  test('should filter unread notifications', async () => {
    // Create test notifications
    const now = Date.now();
    db.prepare(`
      INSERT INTO notifications (user_id, content, is_read, created_at)
      VALUES (?, ?, 0, ?)
    `).run(user.id, 'Unread notification', now);
    
    db.prepare(`
      INSERT INTO notifications (user_id, content, is_read, created_at)
      VALUES (?, ?, 1, ?)
    `).run(user.id, 'Read notification', now - 1000);

    const response = await request(app)
      .get('/api/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${user.token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].isRead).toBe(false);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .get('/api/notifications');

    expect(response.status).toBe(401);
  });
});

describe('POST /api/notifications/:notificationId/read', () => {
  test('should mark notification as read', async () => {
    // Create test notification
    const now = Date.now();
    const result = db.prepare(`
      INSERT INTO notifications (user_id, content, is_read, created_at)
      VALUES (?, ?, 0, ?)
    `).run(user.id, 'Test notification', now);

    const notificationId = result.lastInsertRowid;

    const response = await request(app)
      .post(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${user.token}`);

    expect(response.status).toBe(200);
    
    // Verify notification is marked as read
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?')
      .get(notificationId);
    expect(notification.is_read).toBe(1);
  });

  test('should only allow marking own notifications', async () => {
    const otherUser = createTestUser(db, {
      phone: '0222222222',
      roleName: 'WORKER'
    });

    // Create notification for other user
    const now = Date.now();
    const result = db.prepare(`
      INSERT INTO notifications (user_id, content, is_read, created_at)
      VALUES (?, ?, 0, ?)
    `).run(otherUser.id, 'Other user notification', now);

    const notificationId = result.lastInsertRowid;

    const response = await request(app)
      .post(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${user.token}`);

    expect(response.status).toBe(403);
  });

  test('should require authentication', async () => {
    const response = await request(app)
      .post('/api/notifications/1/read');

    expect(response.status).toBe(401);
  });
});

