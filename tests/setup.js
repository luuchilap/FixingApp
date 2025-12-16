/**
 * Test setup and utilities
 * Provides database initialization, cleanup, and helper functions for integration tests
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Test database path
const TEST_DB_PATH = path.join(__dirname, '../test.db');

/**
 * Initialize a fresh test database
 * This will be called before each test suite
 */
function initTestDatabase() {
  // Remove existing test database if it exists
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const db = new Database(TEST_DB_PATH);

  // Create schema (will be implemented in actual migrations)
  // For now, this is a placeholder that will be replaced with actual DDL
  createSchema(db);

  return db;
}

/**
 * Create database schema
 * This will be replaced with actual migration files later
 */
function createSchema(db) {
  // Roles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(20) NOT NULL UNIQUE
    );
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(15) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      address TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // User roles junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
  `);

  // Employer profiles
  db.exec(`
    CREATE TABLE IF NOT EXISTS employer_profiles (
      user_id INTEGER PRIMARY KEY,
      activity_score INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Worker profiles
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_profiles (
      user_id INTEGER PRIMARY KEY,
      skill VARCHAR(100),
      avg_rating DECIMAL(2,1) DEFAULT 0.0,
      is_verified BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Worker certificates
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      reviewed_by INTEGER,
      reviewed_at INTEGER,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      price BIGINT NOT NULL,
      address TEXT NOT NULL,
      required_skill VARCHAR(100),
      status VARCHAR(20) DEFAULT 'CHUA_LAM',
      accepted_worker_id INTEGER,
      handover_deadline INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (accepted_worker_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      price BIGINT NOT NULL,
      address TEXT NOT NULL,
      required_skill VARCHAR(100),
      status VARCHAR(20) DEFAULT 'CHUA_LAM',
      accepted_worker_id INTEGER,
      handover_deadline INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (accepted_worker_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Job images
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT 0,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // Job applications
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'APPLIED',
      applied_at INTEGER NOT NULL,
      UNIQUE(job_id, worker_id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Job status logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      old_status VARCHAR(20),
      new_status VARCHAR(20) NOT NULL,
      changed_by INTEGER NOT NULL,
      changed_at INTEGER NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Worker reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL UNIQUE,
      worker_id INTEGER NOT NULL,
      employer_id INTEGER NOT NULL,
      stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
      comment TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Complaints
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      decision VARCHAR(20),
      resolved_by INTEGER,
      resolved_at INTEGER,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Complaint evidences
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaint_evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      evidence_type VARCHAR(20) NOT NULL,
      evidence_url TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );
  `);

  // Notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Insert default roles
  const roles = [
    { name: 'EMPLOYER' },
    { name: 'WORKER' },
    { name: 'ADMIN' }
  ];

  const insertRole = db.prepare('INSERT INTO roles (name) VALUES (?)');
  roles.forEach(role => {
    try {
      insertRole.run(role.name);
    } catch (err) {
      // Role might already exist, ignore
    }
  });
}

/**
 * Clean up test database
 */
function cleanupTestDatabase() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

/**
 * Get current timestamp in milliseconds
 */
function getCurrentTimestamp() {
  return Date.now();
}

module.exports = {
  initTestDatabase,
  cleanupTestDatabase,
  getCurrentTimestamp,
  TEST_DB_PATH
};

