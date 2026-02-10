/**
 * Database configuration and connection
 * Uses pg (node-postgres) for PostgreSQL database (Neon)
 */

const { Pool } = require('pg');

// Parse connection string or use individual environment variables
// Neon PostgreSQL connection string format:
// postgresql://user:password@host/database?sslmode=require
const connectionString = process.env.DATABASE_URL ||
  (process.env.DB_HOST ?
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST}/${process.env.DB_NAME || 'postgres'}${process.env.DB_SSL === 'true' ? '?sslmode=require' : ''}` :
    null
  );

if (!connectionString) {
  throw new Error('DATABASE_URL or DB_HOST environment variable must be set');
}

// Create connection pool
const pool = new Pool({
  connectionString,
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 3000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established (increased for Neon serverless)
  ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL?.includes('sslmode=require') ? {
    rejectUnauthorized: false // For Neon and other cloud providers
  } : false
});

// Test the connection
pool.on('connect', () => {
  console.log('Database connection pool created');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit on connection errors - let the pool handle reconnection
  // Only exit on critical errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    console.error('Database connection failed. Check your DATABASE_URL and network connectivity.');
  }
});

// Helper function to execute queries with better error handling and retry logic
async function query(text, params, retries = 1) {
  const start = Date.now();
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: res.rowCount });
      }
      return res;
    } catch (error) {
      lastError = error;

      // Retry on connection timeout errors
      if (attempt < retries && (
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNREFUSED') ||
        error.code === 'ETIMEDOUT'
      )) {
        const waitTime = (attempt + 1) * 1000; // Exponential backoff: 1s, 2s
        console.warn(`Query timeout, retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      console.error('Database query error', { text, error: error.message, code: error.code });
      throw error;
    }
  }

  throw lastError;
}

// Helper function for transactions
async function transaction(callback) {
  const client = await pool.connect();
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
}

// Helper to execute SQL statements (for migrations)
async function exec(sql) {
  // Split by semicolon and execute each statement
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const statement of statements) {
    await query(statement);
  }
}

// Export both the pool and helper functions
// For backward compatibility, we'll create a db object that mimics better-sqlite3 API
const db = {
  // Async query methods
  query,
  transaction,

  // Helper methods that wrap pool methods
  async prepare(sql) {
    // Return a prepared statement-like object
    return {
      run: async (...params) => {
        const result = await query(sql, params);
        return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id };
      },
      get: async (...params) => {
        const result = await query(sql, params);
        return result.rows[0] || null;
      },
      all: async (...params) => {
        const result = await query(sql, params);
        return result.rows;
      },
      exec: async (sql) => {
        await query(sql);
      }
    };
  },

  // Direct exec for migrations
  exec,

  // Get the pool for advanced usage
  pool
};

// Log database connection
console.log(`Database configured for PostgreSQL (Neon)`);

module.exports = db;
