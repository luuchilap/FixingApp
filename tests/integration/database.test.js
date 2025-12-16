/**
 * Integration tests for database schema
 * Tests: Table creation, constraints, foreign keys
 */

const { initTestDatabase, cleanupTestDatabase } = require('../setup');

describe('Database Schema', () => {
  let testDb;

  beforeAll(() => {
    // Initialize test database
    testDb = initTestDatabase();
  });

  afterAll(() => {
    cleanupTestDatabase();
    if (testDb) testDb.close();
  });

  describe('Roles table', () => {
    test('should have roles table', () => {
      const tables = testDb.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='roles'
      `).get();
      
      expect(tables).toBeDefined();
      expect(tables.name).toBe('roles');
    });

    test('should have correct columns', () => {
      const columns = testDb.prepare('PRAGMA table_info(roles)').all();
      const columnNames = columns.map(col => col.name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
    });

    test('should have default roles inserted', () => {
      const roles = testDb.prepare('SELECT name FROM roles ORDER BY name').all();
      const roleNames = roles.map(r => r.name);
      
      expect(roleNames).toContain('EMPLOYER');
      expect(roleNames).toContain('WORKER');
      expect(roleNames).toContain('ADMIN');
    });

    test('should enforce unique constraint on role name', () => {
      const insertRole = testDb.prepare('INSERT INTO roles (name) VALUES (?)');
      
      // Try to insert a role that already exists (EMPLOYER is inserted by migration)
      expect(() => {
        insertRole.run('EMPLOYER'); // Should fail because EMPLOYER already exists
      }).toThrow();
      
      // Verify we can still insert a new unique role
      insertRole.run('TEST_ROLE');
      const checkRole = testDb.prepare('SELECT * FROM roles WHERE name = ?');
      expect(checkRole.get('TEST_ROLE')).toBeDefined();
    });
  });

  describe('Users table', () => {
    test('should have users table', () => {
      const tables = testDb.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'
      `).get();
      
      expect(tables).toBeDefined();
      expect(tables.name).toBe('users');
    });

    test('should have correct columns', () => {
      const columns = testDb.prepare('PRAGMA table_info(users)').all();
      const columnNames = columns.map(col => col.name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('phone');
      expect(columnNames).toContain('password_hash');
      expect(columnNames).toContain('full_name');
      expect(columnNames).toContain('address');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('should enforce unique constraint on phone', () => {
      const now = Date.now();
      const insertUser = testDb.prepare(`
        INSERT INTO users (phone, password_hash, full_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      insertUser.run('0123456789', 'hash1', 'User 1', now, now);
      
      expect(() => {
        insertUser.run('0123456789', 'hash2', 'User 2', now, now);
      }).toThrow();
    });

    test('should require non-null fields', () => {
      const insertUser = testDb.prepare(`
        INSERT INTO users (phone, password_hash, full_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const now = Date.now();
      
      // Missing phone
      expect(() => {
        insertUser.run(null, 'hash', 'Name', now, now);
      }).toThrow();
      
      // Missing password_hash
      expect(() => {
        insertUser.run('0987654321', null, 'Name', now, now);
      }).toThrow();
      
      // Missing full_name
      expect(() => {
        insertUser.run('0987654322', 'hash', null, now, now);
      }).toThrow();
    });
  });

  describe('User Roles table', () => {
    test('should have user_roles table', () => {
      const tables = testDb.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='user_roles'
      `).get();
      
      expect(tables).toBeDefined();
      expect(tables.name).toBe('user_roles');
    });

    test('should have correct columns', () => {
      const columns = testDb.prepare('PRAGMA table_info(user_roles)').all();
      const columnNames = columns.map(col => col.name);
      
      expect(columnNames).toContain('user_id');
      expect(columnNames).toContain('role_id');
    });

    test('should enforce foreign key constraint on user_id', () => {
      const insertUserRole = testDb.prepare(`
        INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)
      `);
      
      const getRole = testDb.prepare('SELECT id FROM roles WHERE name = ?');
      const employerRole = getRole.get('EMPLOYER');
      
      // Try to insert with non-existent user_id
      expect(() => {
        insertUserRole.run(99999, employerRole.id);
      }).toThrow();
    });

    test('should enforce foreign key constraint on role_id', () => {
      const now = Date.now();
      const insertUser = testDb.prepare(`
        INSERT INTO users (phone, password_hash, full_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = insertUser.run('0111111111', 'hash', 'Test User', now, now);
      const userId = result.lastInsertRowid;
      
      const insertUserRole = testDb.prepare(`
        INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)
      `);
      
      // Try to insert with non-existent role_id
      expect(() => {
        insertUserRole.run(userId, 99999);
      }).toThrow();
    });

    test('should enforce composite primary key', () => {
      const now = Date.now();
      const insertUser = testDb.prepare(`
        INSERT INTO users (phone, password_hash, full_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = insertUser.run('0222222222', 'hash', 'Test User 2', now, now);
      const userId = result.lastInsertRowid;
      
      const getRole = testDb.prepare('SELECT id FROM roles WHERE name = ?');
      const employerRole = getRole.get('EMPLOYER');
      
      const insertUserRole = testDb.prepare(`
        INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)
      `);
      
      // First insert succeeds
      insertUserRole.run(userId, employerRole.id);
      
      // Duplicate insert should fail
      expect(() => {
        insertUserRole.run(userId, employerRole.id);
      }).toThrow();
    });

    test('should cascade delete when user is deleted', () => {
      const now = Date.now();
      const insertUser = testDb.prepare(`
        INSERT INTO users (phone, password_hash, full_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = insertUser.run('0333333333', 'hash', 'Test User 3', now, now);
      const userId = result.lastInsertRowid;
      
      const getRole = testDb.prepare('SELECT id FROM roles WHERE name = ?');
      const workerRole = getRole.get('WORKER');
      
      const insertUserRole = testDb.prepare(`
        INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)
      `);
      insertUserRole.run(userId, workerRole.id);
      
      // Verify user_role exists
      const checkUserRole = testDb.prepare('SELECT * FROM user_roles WHERE user_id = ?');
      expect(checkUserRole.get(userId)).toBeDefined();
      
      // Delete user
      const deleteUser = testDb.prepare('DELETE FROM users WHERE id = ?');
      deleteUser.run(userId);
      
      // Verify user_role was cascade deleted
      expect(checkUserRole.get(userId)).toBeUndefined();
    });
  });

  describe('Database connection', () => {
    test('should execute simple query', () => {
      const result = testDb.prepare('SELECT 1 as value').get();
      expect(result.value).toBe(1);
    });

    test('should have foreign keys enabled', () => {
      const result = testDb.pragma('foreign_keys');
      expect(result[0].foreign_keys).toBe(1);
    });
  });
});

