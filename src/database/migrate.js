/**
 * Database migration runner
 * Executes migrations in order
 */

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');
const db = require('../config/db');

// Create migrations table to track executed migrations
function initMigrationsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at INTEGER NOT NULL
    );
  `);
}

function getExecutedMigrations() {
  const stmt = db.prepare('SELECT name FROM migrations ORDER BY id');
  return stmt.all().map(row => row.name);
}

function recordMigration(name) {
  const stmt = db.prepare('INSERT INTO migrations (name, executed_at) VALUES (?, ?)');
  stmt.run(name, Date.now());
}

function runMigrations() {
  initMigrationsTable();
  const executed = getExecutedMigrations();

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
      db.transaction(() => {
        migration.up();
        recordMigration(migrationName);
      })();
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
  runMigrations();
}

module.exports = { runMigrations };

