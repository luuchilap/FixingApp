/**
 * Job applications schema migration
 * Creates: job_applications table
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
  
  // Create job_applications table
  await exec(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      status VARCHAR(20) DEFAULT 'APPLIED',
      applied_at BIGINT NOT NULL,
      UNIQUE(job_id, worker_id),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  await exec('CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_applications_worker ON job_applications(worker_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);');

  console.log('Job applications schema migration completed');
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
  
  await exec('DROP TABLE IF EXISTS job_applications;');

  console.log('Job applications schema migration rolled back');
}

module.exports = { up, down };
