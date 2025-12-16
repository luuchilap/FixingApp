/**
 * Worker certificates schema migration
 * Creates: worker_certificates table
 */

const db = require('../../config/db');

function up() {
  // Create worker_certificates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      reviewed_by INTEGER,
      reviewed_at INTEGER,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create indexes for better query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_certificates_worker ON worker_certificates(worker_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_certificates_status ON worker_certificates(status);');

  console.log('Worker certificates schema migration completed');
}

function down() {
  db.exec('DROP TABLE IF EXISTS worker_certificates;');

  console.log('Worker certificates schema migration rolled back');
}

module.exports = { up, down };

