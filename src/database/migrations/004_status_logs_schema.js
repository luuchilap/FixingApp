/**
 * Job status logs schema migration
 * Creates: job_status_logs table
 */

const db = require('../../config/db');

function up() {
  // Create job_status_logs table
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

  // Create indexes for better query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_status_logs_job ON job_status_logs(job_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_status_logs_changed_at ON job_status_logs(changed_at);');

  console.log('Job status logs schema migration completed');
}

function down() {
  db.exec('DROP TABLE IF EXISTS job_status_logs;');

  console.log('Job status logs schema migration rolled back');
}

module.exports = { up, down };

