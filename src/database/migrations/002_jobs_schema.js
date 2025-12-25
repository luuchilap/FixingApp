/**
 * Jobs schema migration
 * Creates: jobs, job_images tables
 */

async function up(client) {
  // Helper to execute SQL - works with both client and db
  const exec = async (sql) => {
    if (client) {
      await client.query(sql);
    } else {
      const db = require('../../config/db');
      await db.exec(sql);
    }
  };
  
  // Create jobs table
  await exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      employer_id INTEGER NOT NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      price BIGINT NOT NULL,
      address TEXT NOT NULL,
      required_skill VARCHAR(100),
      status VARCHAR(20) DEFAULT 'CHUA_LAM',
      accepted_worker_id INTEGER,
      handover_deadline BIGINT,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (accepted_worker_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create job_images table
  await exec(`
    CREATE TABLE IF NOT EXISTS job_images (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better query performance
  await exec('CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);');
  await exec('CREATE INDEX IF NOT EXISTS idx_jobs_skill ON jobs(required_skill);');
  await exec('CREATE INDEX IF NOT EXISTS idx_job_images_job ON job_images(job_id);');

  console.log('Jobs schema migration completed');
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
  
  await exec('DROP TABLE IF EXISTS job_images;');
  await exec('DROP TABLE IF EXISTS jobs;');

  console.log('Jobs schema migration rolled back');
}

module.exports = { up, down };
