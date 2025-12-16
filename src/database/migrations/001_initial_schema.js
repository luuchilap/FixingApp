/**
 * Initial database schema migration
 * Creates: roles, users, user_roles tables
 */

const db = require('../../config/db');

function up() {
  // Create roles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(20) NOT NULL UNIQUE
    );
  `);

  // Create users table
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

  // Create user_roles junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
  `);

  // Create employer_profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employer_profiles (
      user_id INTEGER PRIMARY KEY,
      activity_score INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create worker_profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_profiles (
      user_id INTEGER PRIMARY KEY,
      skill VARCHAR(100),
      avg_rating DECIMAL(2,1) DEFAULT 0.0,
      is_verified BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Insert default roles if they don't exist
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)');
  insertRole.run('EMPLOYER');
  insertRole.run('WORKER');
  insertRole.run('ADMIN');

  console.log('Initial schema migration completed');
}

function down() {
  // Drop tables in reverse order (respecting foreign keys)
  db.exec('DROP TABLE IF EXISTS worker_profiles;');
  db.exec('DROP TABLE IF EXISTS employer_profiles;');
  db.exec('DROP TABLE IF EXISTS user_roles;');
  db.exec('DROP TABLE IF EXISTS users;');
  db.exec('DROP TABLE IF EXISTS roles;');

  console.log('Initial schema migration rolled back');
}

module.exports = { up, down };

