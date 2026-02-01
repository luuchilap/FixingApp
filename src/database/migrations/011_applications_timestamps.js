/**
 * Add timestamps for application status changes
 * Adds: accepted_at, rejected_at columns to job_applications table
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
  
  // Add accepted_at column
  await exec(`
    ALTER TABLE job_applications 
    ADD COLUMN IF NOT EXISTS accepted_at BIGINT;
  `);

  // Add rejected_at column
  await exec(`
    ALTER TABLE job_applications 
    ADD COLUMN IF NOT EXISTS rejected_at BIGINT;
  `);

  console.log('Applications timestamps migration completed');
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
  
  await exec('ALTER TABLE job_applications DROP COLUMN IF EXISTS accepted_at;');
  await exec('ALTER TABLE job_applications DROP COLUMN IF EXISTS rejected_at;');

  console.log('Applications timestamps migration rolled back');
}

module.exports = { up, down };
