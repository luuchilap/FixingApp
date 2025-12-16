/**
 * Jobs schema migration
 * Creates: jobs, job_images tables
 */

const db = require('../../config/db');

function up() {
  // Create jobs table
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

  // Create job_images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT 0,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_jobs_skill ON jobs(required_skill);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_job_images_job ON job_images(job_id);');

  console.log('Jobs schema migration completed');
}

function down() {
  db.exec('DROP TABLE IF EXISTS job_images;');
  db.exec('DROP TABLE IF EXISTS jobs;');

  console.log('Jobs schema migration rolled back');
}

module.exports = { up, down };

