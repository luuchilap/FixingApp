/**
 * Database migration runner
 * Executes migrations in order
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');
const db = require('../config/db');

// Create migrations table to track executed migrations
async function initMigrationsTable() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at BIGINT NOT NULL
    );
  `);
}

async function getExecutedMigrations() {
  const result = await db.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
}

async function recordMigration(name) {
  await db.query('INSERT INTO migrations (name, executed_at) VALUES ($1, $2)', [name, Date.now()]);
}

async function runMigrations() {
  await initMigrationsTable();
  const executed = await getExecutedMigrations();

  // Get all migration files
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js') && file !== 'migrate.js')
    .sort();

  console.log(`Found ${files.length} migration file(s)`);

  for (const file of files) {
    const migrationName = file.replace('.js', '');
    
    if (executed.includes(migrationName)) {
      console.log(`Skipping already executed migration: ${migrationName}`);
      continue;
    }

    console.log(`Running migration: ${migrationName}`);
    const migration = require(path.join(migrationsDir, file));
    
    try {
      await db.transaction(async (client) => {
        await migration.up(client);
        await client.query('INSERT INTO migrations (name, executed_at) VALUES ($1, $2)', [migrationName, Date.now()]);
      });
      console.log(`✓ Migration ${migrationName} completed`);
    } catch (error) {
      console.error(`✗ Migration ${migrationName} failed:`, error);
      throw error;
    }
  }

  console.log('All migrations completed');
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigrations };
