/**
 * Worker reviews schema migration
 * Creates: worker_reviews table
 */

const db = require('../../config/db');

function up() {
  // Create worker_reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      employer_id INTEGER NOT NULL,
      stars INTEGER NOT NULL,
      comment TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(job_id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_reviews_worker ON worker_reviews(worker_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_reviews_employer ON worker_reviews(employer_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_reviews_job ON worker_reviews(job_id);');

  console.log('Worker reviews schema migration completed');
}

function down() {
  db.exec('DROP TABLE IF EXISTS worker_reviews;');

  console.log('Worker reviews schema migration rolled back');
}

module.exports = { up, down };

