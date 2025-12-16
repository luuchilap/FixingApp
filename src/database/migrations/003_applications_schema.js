/**
 * Job applications schema migration
 * Creates: job_applications table
 */

const db = require('../../config/db');

function up() {
  // Create job_applications table
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

  // Create indexes for better query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_applications_worker ON job_applications(worker_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);');

  console.log('Job applications schema migration completed');
}

function down() {
  db.exec('DROP TABLE IF EXISTS job_applications;');

  console.log('Job applications schema migration rolled back');
}

module.exports = { up, down };

