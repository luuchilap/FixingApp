/**
 * Worker certificates schema migration
 * Creates: worker_certificates table
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
  
  // Create worker_certificates table
  await exec(`
    CREATE TABLE IF NOT EXISTS worker_certificates (
      id SERIAL PRIMARY KEY,
      worker_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'PENDING',
      reviewed_by INTEGER,
      reviewed_at BIGINT,
      FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create indexes for better query performance
  await exec('CREATE INDEX IF NOT EXISTS idx_certificates_worker ON worker_certificates(worker_id);');
  await exec('CREATE INDEX IF NOT EXISTS idx_certificates_status ON worker_certificates(status);');

  console.log('Worker certificates schema migration completed');
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
  
  await exec('DROP TABLE IF EXISTS worker_certificates;');

  console.log('Worker certificates schema migration rolled back');
}

module.exports = { up, down };
