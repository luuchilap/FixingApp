/**
 * Initial database schema migration
 * Creates: roles, users, user_roles tables
 */

async function up(client) {
  // Helper to execute SQL - works with both client and db
  const exec = async (sql) => {
    if (client) {
      // Client is a PostgreSQL client, use query directly
      await client.query(sql);
    } else {
      // Use db.exec
      const db = require('../../config/db');
      await db.exec(sql);
    }
  };
  
  const query = async (sql, params) => {
    if (client) {
      return await client.query(sql, params);
    } else {
      const db = require('../../config/db');
      return await db.query(sql, params);
    }
  };
  
  // Create roles table
  await exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(20) NOT NULL UNIQUE
    );
  `);

  // Create users table
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(15) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      address TEXT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `);

  // Create user_roles junction table
  await exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
  `);

  // Create employer_profiles table
  await exec(`
    CREATE TABLE IF NOT EXISTS employer_profiles (
      user_id INTEGER PRIMARY KEY,
      activity_score INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create worker_profiles table
  await exec(`
    CREATE TABLE IF NOT EXISTS worker_profiles (
      user_id INTEGER PRIMARY KEY,
      skill VARCHAR(100),
      avg_rating DECIMAL(2,1) DEFAULT 0.0,
      is_verified BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Insert default roles if they don't exist
  await query('INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', ['EMPLOYER']);
  await query('INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', ['WORKER']);
  await query('INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', ['ADMIN']);

  console.log('Initial schema migration completed');
}

async function down(client) {
  // Helper to execute SQL
  const exec = async (sql) => {
    if (client) {
      await client.query(sql);
    } else {
      const db = require('../../config/db');
      await db.exec(sql);
    }
  };
  
  // Drop tables in reverse order (respecting foreign keys)
  await exec('DROP TABLE IF EXISTS worker_profiles;');
  await exec('DROP TABLE IF EXISTS employer_profiles;');
  await exec('DROP TABLE IF EXISTS user_roles;');
  await exec('DROP TABLE IF EXISTS users;');
  await exec('DROP TABLE IF EXISTS roles;');

  console.log('Initial schema migration rolled back');
}

module.exports = { up, down };
