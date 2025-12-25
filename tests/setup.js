/**
 * Test setup and utilities
 * Provides database initialization, cleanup, and helper functions for integration tests
 */

const { Pool } = require('pg');
const { runMigrations } = require('../src/database/migrate');

// Test database connection - uses a separate test database
// Set TEST_DATABASE_URL environment variable for test database
const testConnectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testConnectionString) {
  throw new Error('TEST_DATABASE_URL or DATABASE_URL environment variable must be set for tests');
}

// Create test database connection pool
const testPool = new Pool({
  connectionString: testConnectionString,
  ssl: process.env.DB_SSL === 'true' || testConnectionString?.includes('sslmode=require') ? {
    rejectUnauthorized: false
  } : false
});

/**
 * Initialize a fresh test database
 * This will be called before each test suite
 */
async function initTestDatabase() {
  // Run migrations to set up schema
  // Note: This uses the main db connection, so we need to temporarily override it
  const originalDb = require('../src/config/db');
  
  // Create a temporary db object for migrations
  const tempDb = {
    query: async (text, params) => await testPool.query(text, params),
    exec: async (sql) => {
      const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const statement of statements) {
        await testPool.query(statement);
      }
    },
    transaction: async (callback) => {
      const client = await testPool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    pool: testPool
  };

  // Temporarily override db module
  const dbModule = require.cache[require.resolve('../src/config/db')];
  const originalExports = dbModule.exports;
  dbModule.exports = tempDb;

  try {
    // Run migrations
    await runMigrations();
  } finally {
    // Restore original db module
    dbModule.exports = originalExports;
  }

  return testPool;
}

/**
 * Clean up test database
 */
async function cleanupTestDatabase() {
  // Truncate all tables (faster than dropping and recreating)
  const tables = [
    'messages',
    'conversations',
    'notifications',
    'complaint_evidences',
    'complaints',
    'worker_reviews',
    'job_status_logs',
    'job_applications',
    'job_images',
    'jobs',
    'worker_certificates',
    'worker_profiles',
    'employer_profiles',
    'user_roles',
    'users',
    'roles',
    'migrations'
  ];

  // Disable foreign key checks temporarily (PostgreSQL doesn't have this, but we can use TRUNCATE CASCADE)
  for (const table of tables) {
    try {
      await testPool.query(`TRUNCATE TABLE ${table} CASCADE`);
    } catch (error) {
      // Table might not exist, ignore
    }
  }
}

/**
 * Get current timestamp in milliseconds
 */
function getCurrentTimestamp() {
  return Date.now();
}

/**
 * Close test database connection
 */
async function closeTestDatabase() {
  await testPool.end();
}

module.exports = {
  initTestDatabase,
  cleanupTestDatabase,
  getCurrentTimestamp,
  closeTestDatabase,
  testPool
};
