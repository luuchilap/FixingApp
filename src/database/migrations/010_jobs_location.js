/**
 * Jobs location migration
 * Adds latitude and longitude columns to jobs table for location-based search
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
  
  // Add latitude and longitude columns to jobs table
  await exec(`
    ALTER TABLE jobs 
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
  `);

  // Create index for location-based queries (using PostGIS would be better, but for MVP we'll use simple distance calculation)
  await exec('CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;');

  console.log('Jobs location migration completed');
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
  
  await exec('DROP INDEX IF EXISTS idx_jobs_location;');
  await exec(`
    ALTER TABLE jobs 
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS longitude;
  `);

  console.log('Jobs location migration rolled back');
}

module.exports = { up, down };

