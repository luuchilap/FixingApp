/**
 * Complaints schema migration
 * Creates: complaints and complaint_evidences tables
 */

const db = require('../../config/db');

function up() {
  // Create complaints table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      decision VARCHAR(20),
      resolved_by INTEGER,
      resolved_at INTEGER,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create complaint_evidences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaint_evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      evidence_type VARCHAR(20) NOT NULL,
      evidence_url TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  db.exec('CREATE INDEX IF NOT EXISTS idx_complaints_job ON complaints(job_id);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_complaints_created_by ON complaints(created_by);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_evidences_complaint ON complaint_evidences(complaint_id);');

  console.log('Complaints schema migration completed');
}

function down() {
  db.exec('DROP TABLE IF EXISTS complaint_evidences;');
  db.exec('DROP TABLE IF EXISTS complaints;');

  console.log('Complaints schema migration rolled back');
}

module.exports = { up, down };

