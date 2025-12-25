/**
 * Complaints schema migration
 * Creates: complaints and complaint_evidences tables
 */

async function up(client) {
  const exec = async (sql) => {
    if (client) {
      await client.query(sql);
    } else {
      const db = require('../../config/db');
      await db.exec(sql);
    }
  };
  
  // Create complaints table
  await exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      decision VARCHAR(20),
      resolved_by INTEGER,
      resolved_at BIGINT,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create complaint_evidences table
  await exec(`
    CREATE TABLE IF NOT EXISTS complaint_evidences (
      id SERIAL PRIMARY KEY,
      complaint_id INTEGER NOT NULL,
      evidence_type VARCHAR(20) NOT NULL,
      evidence_url TEXT NOT NULL,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  await exec('CREATE INDEX IF NOT EXISTS idx_complaints_job ON complaints(job_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_complaints_created_by ON complaints(created_by);');
  await exec('CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);');
  await exec('CREATE INDEX IF NOT EXISTS idx_evidences_complaint ON complaint_evidences(complaint_id);');

  console.log('Complaints schema migration completed');
}

async function down(client) {
  const exec = async (sql) => {
    if (client) {
      await client.query(sql);
    } else {
      const db = require('../../config/db');
      await db.exec(sql);
    }
  };
  
  await exec('DROP TABLE IF EXISTS complaint_evidences;');
  await exec('DROP TABLE IF EXISTS complaints;');

  console.log('Complaints schema migration rolled back');
}

module.exports = { up, down };
